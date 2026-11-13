import type { PublishedPointerSplit } from '../shared/schema/publishedPointer.ts';
import {
  detailChunkRelativePath,
  mergeCatalogSearchWithDetail,
} from '../shared/catalog/catalogSplitClient.ts';
import type { CatalogDetailOverlay, CatalogSearchCard } from '../shared/schema/catalogSearch.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import { OTCP_CARD_SCHEMA_VERSION } from '../shared/schema/constants.ts';
import { validateDetailChunk } from '../shared/schema/validate.ts';
import { publicDataUrl } from './paths.ts';

export type CatalogDetailSource = {
  detailsPrefix: string;
  detailsBucketSize: number;
  detailBucketCount: number;
};

export function catalogDetailSourceFromPointer(
  pointer: PublishedPointerSplit,
  detailBucketCount: number,
): CatalogDetailSource {
  return {
    detailsPrefix: pointer.detailsPrefix,
    detailsBucketSize: pointer.detailsBucketSize,
    detailBucketCount,
  };
}

const chunkCache = new Map<string, Promise<Map<number, CatalogDetailOverlay>>>();

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Response was not valid JSON.');
  }
}

async function loadDetailChunk(
  source: CatalogDetailSource,
  bucket: number,
  fetchImpl: typeof fetch,
): Promise<Map<number, CatalogDetailOverlay>> {
  const chunkUrl = publicDataUrl(detailChunkRelativePath(source.detailsPrefix, bucket));
  const response = await fetchImpl(chunkUrl);
  if (response.status === 404) {
    return new Map();
  }
  if (!response.ok) {
    throw new Error(`Could not load card detail chunk (${response.status}).`);
  }
  const json = await readJson(response);
  const validated = validateDetailChunk(json);
  if (!validated.ok) {
    throw new Error('The published card detail chunk failed validation.');
  }
  const map = new Map<number, CatalogDetailOverlay>();
  for (const [idText, overlay] of Object.entries(validated.data.cards)) {
    const id = Number.parseInt(idText, 10);
    if (Number.isFinite(id)) map.set(id, overlay);
  }
  return map;
}

function chunkCacheKey(source: CatalogDetailSource, bucket: number): string {
  return `${source.detailsPrefix}|${source.detailsBucketSize}|${bucket}`;
}

export async function fetchDetailOverlay(
  source: CatalogDetailSource,
  card: Pick<CatalogSearchCard, 'id' | 'detailBucket'>,
  fetchImpl: typeof fetch = fetch,
): Promise<CatalogDetailOverlay | undefined> {
  const bucket = card.detailBucket;
  const cacheKey = chunkCacheKey(source, bucket);
  let inflight = chunkCache.get(cacheKey);
  if (!inflight) {
    inflight = loadDetailChunk(source, bucket, fetchImpl);
    chunkCache.set(cacheKey, inflight);
  }
  const chunk = await inflight;
  return chunk.get(card.id);
}

export async function hydrateSearchCardsFromDetails(
  searchCards: readonly CatalogSearchCard[],
  source: CatalogDetailSource,
  fetchImpl: typeof fetch = fetch,
): Promise<YugiohCard[]> {
  const bucketMaps = await Promise.all(
    Array.from({ length: source.detailBucketCount }, (_, bucket) => {
      const cacheKey = chunkCacheKey(source, bucket);
      let inflight = chunkCache.get(cacheKey);
      if (!inflight) {
        inflight = loadDetailChunk(source, bucket, fetchImpl);
        chunkCache.set(cacheKey, inflight);
      }
      return inflight;
    }),
  );

  const overlayById = new Map<number, CatalogDetailOverlay>();
  for (const map of bucketMaps) {
    for (const [id, overlay] of map) {
      overlayById.set(id, overlay);
    }
  }

  return searchCards.map((searchCard) =>
    mergeCatalogSearchWithDetail(searchCard, overlayById.get(searchCard.id)),
  );
}

export async function fetchCardDetailRecord(
  searchCard: CatalogSearchCard | YugiohCard,
  source: CatalogDetailSource | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<YugiohCard> {
  if (!source) {
    if ('schemaVersion' in searchCard && searchCard.schemaVersion === OTCP_CARD_SCHEMA_VERSION) {
      return searchCard;
    }
    return mergeCatalogSearchWithDetail(searchCard as CatalogSearchCard, undefined);
  }
  const catalogSearchCard = searchCard as CatalogSearchCard;
  const overlay = await fetchDetailOverlay(source, catalogSearchCard, fetchImpl);
  return mergeCatalogSearchWithDetail(catalogSearchCard, overlay);
}

/** Test-only: drop cached detail chunks. */
export function clearCardDetailChunkCache(): void {
  chunkCache.clear();
}
