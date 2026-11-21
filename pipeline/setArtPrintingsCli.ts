#!/usr/bin/env node
/**
 * Regenerates src/catalog/data/setArtPrintings.json.
 *
 *   npm run build:set-art            # uses the reviewed table, reports anything new
 *   npm run build:set-art -- --match # also suggests image ids for new artworks
 *
 * Pages and images are cached under the OS temp folder (OTCP_SET_ART_CACHE to change it),
 * and requests to the official database are spaced two seconds apart.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { OTCP_PIPELINE_USER_AGENT, YGOPRODECK_CARDINFO_URL } from './constants.ts';
import {
  buildSetArtPrintings,
  parseOfficialArtworkImages,
  parseOfficialPrintings,
  type MultiArtCard,
  type OfficialPrintingRow,
  type SetArtReview,
} from './setArtPrintings.ts';
import { fetchYgoprodeckJson } from './ygoprodeckFetch.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const reviewPath = join(repoRoot, 'pipeline', 'setArtReview.json');
const outputPath = join(repoRoot, 'src', 'catalog', 'data', 'setArtPrintings.json');
const cacheDir = process.env.OTCP_SET_ART_CACHE ?? join(tmpdir(), 'otcp-set-art');
const OFFICIAL_DB = 'https://www.db.yugioh-card.com';
const OFFICIAL_DELAY_MS = 2000;

type CardInfo = {
  id: number;
  name: string;
  card_images?: { id: number }[];
  card_sets?: { set_code: string; set_name: string; set_rarity: string }[];
  misc_info?: { konami_id?: number }[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function cached(path: string, load: () => Promise<Buffer>): Promise<Buffer> {
  if (existsSync(path)) return readFile(path);
  await mkdir(dirname(path), { recursive: true });
  const body = await load();
  await writeFile(path, body);
  return body;
}

async function download(url: string, delayMs: number): Promise<Buffer> {
  const response = await fetch(url, { headers: { 'User-Agent': OTCP_PIPELINE_USER_AGENT } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  await sleep(delayMs);
  return body;
}

/** Normalized 24×24 colour fingerprint of an artwork. */
async function fingerprint(image: Buffer, fullCard: boolean): Promise<Float64Array> {
  let pipeline = sharp(image).removeAlpha();
  if (fullCard) {
    const { width = 0, height = 0 } = await sharp(image).metadata();
    pipeline = pipeline.extract({
      left: Math.round(width * 0.12),
      top: Math.round(height * 0.183),
      width: Math.round(width * 0.76),
      height: Math.round(height * 0.522),
    });
  }
  const pixels = await pipeline.resize(24, 24, { fit: 'fill' }).raw().toBuffer();
  const values = new Float64Array(pixels.length);
  for (let channel = 0; channel < 3; channel += 1) {
    let sum = 0;
    for (let i = channel; i < pixels.length; i += 3) sum += pixels[i]!;
    const mean = sum / (pixels.length / 3);
    for (let i = channel; i < pixels.length; i += 3) values[i] = pixels[i]! - mean;
  }
  const norm = Math.hypot(...values) || 1;
  return values.map((value) => value / norm);
}

const dot = (a: Float64Array, b: Float64Array) =>
  a.reduce((sum, value, i) => sum + value * b[i]!, 0);

const cardInfo = await fetchYgoprodeckJson<{ data: CardInfo[] }>({ url: YGOPRODECK_CARDINFO_URL });
const review = JSON.parse(await readFile(reviewPath, 'utf8')) as SetArtReview;
const suggest = process.argv.includes('--match');

const cards: MultiArtCard[] = [];
const rowsByCard = new Map<number, OfficialPrintingRow[]>();
const suggestions: string[] = [];

for (const info of cardInfo.data) {
  const artIds = (info.card_images ?? []).map((image) => image.id);
  if (artIds.length < 2) continue;
  cards.push({
    id: info.id,
    name: info.name,
    artIds,
    sets: (info.card_sets ?? []).map((set) => ({
      setCode: set.set_code,
      setName: set.set_name,
      setRarity: set.set_rarity,
    })),
  });
  const konamiId = info.misc_info?.[0]?.konami_id;
  if (!konamiId) continue;
  const html = (
    await cached(join(cacheDir, 'official', `${konamiId}.html`), () =>
      download(
        `${OFFICIAL_DB}/yugiohdb/card_search.action?ope=2&cid=${konamiId}&request_locale=en`,
        OFFICIAL_DELAY_MS,
      ),
    )
  ).toString('utf8');
  const rows = parseOfficialPrintings(html);
  rowsByCard.set(info.id, rows);

  const reviewed = review.artworks[String(info.id)]?.ciid ?? {};
  const fresh = [...new Set(rows.map((row) => row.artwork))].filter(
    (artwork) => !(String(artwork) in reviewed),
  );
  if (fresh.length === 0) continue;
  if (!suggest) {
    suggestions.push(`${info.name}: artwork ${fresh.join(', ')} not reviewed yet`);
    continue;
  }
  const images = parseOfficialArtworkImages(html);
  const appArt = await Promise.all(
    artIds.map(async (id) => ({
      id,
      print: await fingerprint(
        await cached(join(cacheDir, 'app', `${id}.jpg`), () =>
          download(`https://images.ygoprodeck.com/images/cards_cropped/${id}.jpg`, 100),
        ),
        false,
      ),
    })),
  );
  for (const artwork of fresh) {
    const path = images.get(artwork);
    if (!path) continue;
    const official = await fingerprint(
      await cached(join(cacheDir, 'official', `${konamiId}_${artwork}.jpg`), () =>
        download(`${OFFICIAL_DB}${path}`, OFFICIAL_DELAY_MS),
      ),
      true,
    );
    const ranked = appArt
      .map((art) => ({ id: art.id, score: dot(official, art.print) }))
      .sort((a, b) => b.score - a.score);
    const [best, next] = ranked;
    suggestions.push(
      `${info.name}: artwork ${artwork} looks like ${best?.id} (score ${best?.score.toFixed(2)}, next ${next?.score.toFixed(2)}). Check by eye, then add it to setArtReview.json.`,
    );
  }
}

const { file, report } = buildSetArtPrintings(cards, rowsByCard, review);
await writeFile(outputPath, `${JSON.stringify(file)}\n`);

const reasons = new Map<string, number>();
for (const entry of report.unmapped)
  reasons.set(entry.reason, (reasons.get(entry.reason) ?? 0) + 1);
console.log(
  `${report.cards} cards with more than one artwork, ${report.printings} printings, ${report.mapped} mapped.`,
);
for (const [reason, count] of reasons) console.log(`  unmapped (${reason}): ${count}`);
for (const line of suggestions) console.log(`  ${line}`);
