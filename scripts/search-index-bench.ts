import { readFileSync } from 'node:fs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { measureSearchPass, SearchIndex } from '../src/search/SearchIndex.ts';
import type { YugiohCard } from '../src/shared/schema/card.ts';

const TARGET_MS = 100;
const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes';

const KEYSTROKE_QUERIES = [
  'd',
  'da',
  'dark',
  'dark magician',
  'ash blossom',
  'blue-eyes',
  '46986420',
  '89631139',
  '14558127',
  'zzzqqq',
];

type ApiCard = {
  id: number;
  name: string;
  desc?: string;
  type: string;
  race?: string;
  attribute?: string;
  level?: number;
  atk?: number;
  def?: number;
  archetype?: string;
  card_images?: { image_url_small?: string; image_url?: string }[];
};

function trimToYugioh(card: ApiCard): YugiohCard {
  const images = card.card_images?.[0];
  return {
    schemaVersion: '1.0.0',
    id: card.id,
    name: card.name,
    type: card.type,
    text: card.desc ?? '',
    images: {
      small: images?.image_url_small ?? '/otcp/card-images/small/placeholder.jpg',
      large: images?.image_url ?? '/otcp/card-images/placeholder.jpg',
    },
    sets: [],
    passcode: card.id,
    attribute: card.attribute as YugiohCard['attribute'],
    level: card.level,
    atk: card.atk,
    def: card.def,
    race: card.race,
    archetype: card.archetype,
  };
}

async function loadCards(): Promise<YugiohCard[]> {
  const file = process.env.SEARCH_BENCH_CARDS_FILE;
  if (file) {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as { data: ApiCard[] } | YugiohCard[];
    const list = Array.isArray(raw) ? raw : raw.data;
    return list.map((entry) => ('schemaVersion' in entry ? entry : trimToYugioh(entry)));
  }

  let last: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(API_URL, { signal: AbortSignal.timeout(120_000) });
      if (!response.ok) throw new Error(`card API ${response.status}`);
      const raw = (await response.json()) as { data: ApiCard[] };
      return raw.data.map(trimToYugioh);
    } catch (error) {
      last = error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
  throw last;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil(p * sorted.length);
  return sorted[Math.min(rank - 1, sorted.length - 1)];
}

function loadBaselineSearchMax(): number | null {
  try {
    const baselinePath = join(
      dirname(fileURLToPath(import.meta.url)),
      '../spikes/s01/results/s01-results.json',
    );
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      rates?: { 6?: { searchOnly?: { max?: number } } };
    };
    return baseline.rates?.[6]?.searchOnly?.max ?? null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const cards = await loadCards();
  const buildStart = performance.now();
  const index = new SearchIndex(cards);
  const buildMs = performance.now() - buildStart;

  const samples: number[] = [];
  for (const query of KEYSTROKE_QUERIES) {
    for (let rep = 0; rep < 50; rep++) {
      samples.push(measureSearchPass(index, query));
    }
  }
  samples.sort((a, b) => a - b);

  const summary = {
    n: samples.length,
    min: samples[0] ?? 0,
    p50: percentile(samples, 0.5),
    p95: percentile(samples, 0.95),
    max: samples[samples.length - 1] ?? 0,
  };

  const baselineSearchMax = loadBaselineSearchMax();
  const pass = summary.max <= TARGET_MS;

  const output = {
    targetMs: TARGET_MS,
    pass,
    rule: 'Pass when the max search-only sample stays at or under the NFR-01 budget.',
    capturedAt: new Date().toISOString(),
    cardCount: cards.length,
    buildMs,
    searchOnly: summary,
    baseline: {
      source: 'spikes/s01/results/s01-results.json',
      emulatedSearchOnlyMaxRate6x: baselineSearchMax,
      note: 'S-01 baseline used emulated mobile CPU throttle; this run is Node without throttle.',
    },
    ratioToBaseline:
      baselineSearchMax && baselineSearchMax > 0 ? summary.max / baselineSearchMax : null,
    samples,
  };

  const outDir = join(dirname(fileURLToPath(import.meta.url)), '../src/search/results');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'search-bench.json'), `${JSON.stringify(output, null, 2)}\n`);

  if (!pass) {
    console.error(`Search bench failed: max ${summary.max} ms exceeds ${TARGET_MS} ms budget.`);
    process.exit(1);
  }

  console.log(
    `Search bench pass: ${summary.max} ms max (${cards.length} cards, build ${buildMs.toFixed(1)} ms).`,
  );
}

void main();
