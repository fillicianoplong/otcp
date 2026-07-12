import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { atomicWriteUtf8 } from '../src/shared/fs/atomicWrite.ts';
import {
  encodeCompactSearchIndex,
  type CompactSearchIndexEnvelope,
} from '../src/shared/schema/compactSearchIndex.ts';
import {
  OTCP_DATASET_SCHEMA_VERSION,
  type CatalogDetailOverlay,
  type CatalogSearchCard,
  type YugiohCard,
} from '../src/shared/schema/index.ts';
import {
  detailBucketObjectName,
  detailChunkRelativePath,
  mergeCatalogSearchWithDetail,
} from '../src/shared/catalog/catalogSplitClient.ts';
import { YGOPRODECK_CARDINFO_URL } from './constants.ts';
import { siteRelativeDatasetFile } from './pointer.ts';
import type { SetIndex } from '../src/shared/schema/setIndex.ts';

export { detailChunkRelativePath, mergeCatalogSearchWithDetail };

export const DEFAULT_DETAIL_BUCKET_SIZE = 500;

export type SplitDatasetPaths = {
  searchIndexPath: string;
  searchIndexRelative: string;
  detailsDir: string;
  detailsDirRelative: string;
  detailsPrefixRelative: string;
};

export type SplitDatasetResult = SplitDatasetPaths & {
  bucketSize: number;
  detailBucketCount: number;
};

function searchIndexFileName(iso: string): string {
  const stamp = iso.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
  return `search-${stamp}.json`;
}

function detailsDirName(iso: string): string {
  const stamp = iso.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
  return `details-${stamp}`;
}

function bucketFileName(bucket: number): string {
  return detailBucketObjectName(bucket);
}

export function toCatalogSearchCard(card: YugiohCard, detailBucket: number): CatalogSearchCard {
  const setNames = [...new Set(card.sets.map((entry) => entry.setName))];
  const rarities = [...new Set(card.sets.map((entry) => entry.setRarity))];
  const slimPrices =
    card.prices == null
      ? undefined
      : {
          ...(card.prices.tcgplayer != null ? { tcgplayer: card.prices.tcgplayer } : {}),
          ...(card.prices.cardmarket != null ? { cardmarket: card.prices.cardmarket } : {}),
          ...(card.prices.coolstuffinc != null ? { coolstuffinc: card.prices.coolstuffinc } : {}),
        };
  const hasPrices = slimPrices && Object.keys(slimPrices).length > 0;

  return {
    id: card.id,
    name: card.name,
    type: card.type,
    setNames,
    rarities,
    detailBucket,
    ...(hasPrices ? { prices: slimPrices } : {}),
    ...(card.passcode != null ? { passcode: card.passcode } : {}),
    ...(card.attribute != null ? { attribute: card.attribute } : {}),
    ...(card.level != null ? { level: card.level } : {}),
    ...(card.rank != null ? { rank: card.rank } : {}),
    ...(card.linkRating != null ? { linkRating: card.linkRating } : {}),
    ...(card.linkMarkers != null ? { linkMarkers: card.linkMarkers } : {}),
    ...(card.atk != null ? { atk: card.atk } : {}),
    ...(card.def != null ? { def: card.def } : {}),
    ...(card.archetype != null ? { archetype: card.archetype } : {}),
    ...(card.race != null ? { race: card.race } : {}),
    ...(card.banlistInfo != null ? { banlistInfo: card.banlistInfo } : {}),
  };
}

export function extractDetailOverlay(card: YugiohCard): CatalogDetailOverlay {
  return {
    text: card.text,
    sets: card.sets,
    ...(card.pendDesc ? { pendDesc: card.pendDesc } : {}),
    ...(card.monsterDesc ? { monsterDesc: card.monsterDesc } : {}),
    ...(card.scale != null ? { scale: card.scale } : {}),
    ...(card.genesysPoints != null ? { genesysPoints: card.genesysPoints } : {}),
  };
}

export function buildSearchIndexEnvelope(
  searchCards: readonly CatalogSearchCard[],
  generatedAt: string,
  setIndex?: SetIndex,
): CompactSearchIndexEnvelope {
  return encodeCompactSearchIndex(searchCards, generatedAt, YGOPRODECK_CARDINFO_URL, setIndex);
}

export function writeSplitDataset(
  datasetsDir: string,
  cards: readonly YugiohCard[],
  generatedAt: string,
  setIndex: SetIndex | undefined,
  bucketSize = DEFAULT_DETAIL_BUCKET_SIZE,
): SplitDatasetResult {
  const searchFile = searchIndexFileName(generatedAt);
  const searchIndexPath = join(datasetsDir, searchFile);
  const searchIndexRelative = siteRelativeDatasetFile(searchFile);

  const detailsFolder = detailsDirName(generatedAt);
  const detailsDir = join(datasetsDir, detailsFolder);
  mkdirSync(detailsDir, { recursive: true });
  const detailsDirRelative = siteRelativeDatasetFile(detailsFolder);
  const detailsPrefixRelative = `${detailsDirRelative}/`.replaceAll('\\', '/');

  const ordered = cards.slice().sort((a, b) => a.id - b.id || a.name.localeCompare(b.name));
  const searchCards = ordered.map((card, index) =>
    toCatalogSearchCard(card, Math.floor(index / bucketSize)),
  );
  const envelope = buildSearchIndexEnvelope(searchCards, generatedAt, setIndex);
  atomicWriteUtf8(searchIndexPath, `${JSON.stringify(envelope)}\n`);

  const buckets = new Map<number, Record<string, CatalogDetailOverlay>>();
  for (let index = 0; index < ordered.length; index += 1) {
    const card = ordered[index]!;
    const bucket = Math.floor(index / bucketSize);
    const overlay = extractDetailOverlay(card);
    let record = buckets.get(bucket);
    if (!record) {
      record = {};
      buckets.set(bucket, record);
    }
    record[String(card.id)] = overlay;
  }

  let detailBucketCount = 0;
  for (const [bucket, record] of buckets) {
    detailBucketCount = Math.max(detailBucketCount, bucket + 1);
    const chunkPath = join(detailsDir, bucketFileName(bucket));
    atomicWriteUtf8(
      chunkPath,
      `${JSON.stringify({ schemaVersion: OTCP_DATASET_SCHEMA_VERSION, bucket, cards: record })}\n`,
    );
  }

  return {
    searchIndexPath,
    searchIndexRelative,
    detailsDir,
    detailsDirRelative,
    detailsPrefixRelative,
    bucketSize,
    detailBucketCount,
  };
}

export function gzipByteLength(json: string): number {
  return gzipSync(json).length;
}

export async function measureSplitGzipRatio(
  cards: readonly YugiohCard[],
  generatedAt: string,
  setIndex?: SetIndex,
): Promise<{ legacyGzipBytes: number; searchIndexGzipBytes: number; ratio: number }> {
  const legacyEnvelope = {
    schemaVersion: '1.0.0',
    generatedAt,
    source: YGOPRODECK_CARDINFO_URL,
    cards,
    ...(setIndex && Object.keys(setIndex).length > 0 ? { setIndex } : {}),
  };
  const ordered = cards.slice().sort((a, b) => a.id - b.id || a.name.localeCompare(b.name));
  const searchCards = ordered.map((card, index) =>
    toCatalogSearchCard(card, Math.floor(index / DEFAULT_DETAIL_BUCKET_SIZE)),
  );
  const searchEnvelope = buildSearchIndexEnvelope(searchCards, generatedAt, setIndex);
  const legacyGzipBytes = gzipByteLength(JSON.stringify(legacyEnvelope));
  const searchIndexGzipBytes = gzipByteLength(JSON.stringify(searchEnvelope));
  return {
    legacyGzipBytes,
    searchIndexGzipBytes,
    ratio: searchIndexGzipBytes / legacyGzipBytes,
  };
}
