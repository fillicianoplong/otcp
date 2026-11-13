import { SearchIndex, optionCount, type GroupView } from './src/index.ts';
import { FACET_STEPS, KEYSTROKE_SERIES } from './src/queries.ts';
import { ON_SCREEN_GROUPS, type FacetSelection, type TrimmedCard } from './src/types.ts';

export type SlowSample = { ms: number; label: string };

export type GroupProbe = { group: string; options: number; ms: number };

export type BenchChecks = {
  cardCount: number;
  darkMagicianByName: boolean;
  darkMagicianByPasscode: boolean;
  accesscodeByPasscode: boolean;
  darkRecount: number;
  darkActual: number;
  spellcasterUnderDarkRecount: number;
  spellcasterUnderDarkActual: number;
};

export type BenchRun = {
  cardCount: number;
  buildSamples: number[];
  heapBefore: number | null;
  heapAfter: number | null;
  bitsetBytes: number;
  bitsetGzipBytes: number;
  trigramCount: number;
  tokenCount: number;
  facetSizes: Record<string, number>;
  keystrokeSamples: number[];
  facetSamples: number[];
  keystrokeOnScreenSamples: number[];
  facetOnScreenSamples: number[];
  searchOnlySamples: number[];
  recountOnlySamples: number[];
  slowestKeystroke: SlowSample;
  slowestFacet: SlowSample;
  groupProbe: GroupProbe[];
  sink: number;
  checks: BenchChecks;
  viewport: { width: number; height: number };
  visualViewport: { width: number; height: number } | null;
  screen: { width: number; height: number };
  devicePixelRatio: number;
  userAgent: string;
  hardwareConcurrency: number;
  deviceMemory: number | null;
};

export type BenchReps = {
  keystroke: number;
  facet: number;
};

type Memory = { usedJSHeapSize: number };

let cachedCards: TrimmedCard[] | null = null;
let sink = 0;

function now(): number {
  return globalThis.performance.now();
}

function usedHeap(): number | null {
  const memory = (globalThis.performance as Performance & { memory?: Memory }).memory;
  return memory ? memory.usedJSHeapSize : null;
}

function collectGarbage(): void {
  const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc;
  gc?.();
}

function touch(ids: readonly number[], groups: readonly GroupView[]): void {
  sink += ids.length;
  for (const group of groups) {
    const counts = group.counts;
    if (counts.length > 0) sink += counts[0] + counts[counts.length - 1];
  }
}

async function loadCards(): Promise<TrimmedCard[]> {
  if (cachedCards) return cachedCards;
  const response = await fetch('/cards.json');
  if (!response.ok) throw new Error(`cards.json ${response.status}`);
  cachedCards = (await response.json()) as TrimmedCard[];
  return cachedCards;
}

async function gzipSize(bytes: Uint8Array): Promise<number> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const stream = new Blob([buffer]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressed = await new Response(stream).arrayBuffer();
  return compressed.byteLength;
}

function timeCombined(
  index: SearchIndex,
  query: string,
  selected: FacetSelection,
  only?: readonly (typeof ON_SCREEN_GROUPS)[number][],
): number {
  const start = now();
  index.search(query);
  const ids = index.collectShown(selected, 50);
  const groups = index.recount(selected, only);
  const elapsed = now() - start;
  touch(ids, groups);
  return elapsed;
}

function runKeystrokes(
  index: SearchIndex,
  reps: number,
  samples: number[],
  slowest: SlowSample,
  only?: readonly (typeof ON_SCREEN_GROUPS)[number][],
): SlowSample {
  let slow = slowest;
  for (let rep = 0; rep < reps; rep++) {
    for (const series of KEYSTROKE_SERIES) {
      for (let i = 1; i <= series.text.length; i++) {
        const query = series.text.slice(0, i);
        const elapsed = timeCombined(index, query, series.selected, only);
        samples.push(elapsed);
        if (elapsed > slow.ms) slow = { ms: elapsed, label: `${series.label} @ "${query}"` };
      }
    }
  }
  return slow;
}

function runFacets(
  index: SearchIndex,
  reps: number,
  samples: number[],
  slowest: SlowSample,
  only?: readonly (typeof ON_SCREEN_GROUPS)[number][],
): SlowSample {
  let slow = slowest;
  for (let rep = 0; rep < reps; rep++) {
    for (const step of FACET_STEPS) {
      const elapsed = timeCombined(index, step.query, step.selected, only);
      samples.push(elapsed);
      if (elapsed > slow.ms) slow = { ms: elapsed, label: step.label };
    }
  }
  return slow;
}

function checksFor(index: SearchIndex, cards: readonly TrimmedCard[]): BenchChecks {
  let darkActual = 0;
  let spellcasterUnderDarkActual = 0;
  for (const card of cards) {
    if (card.attribute === 'DARK') {
      darkActual += 1;
      if (card.race === 'Spellcaster') spellcasterUnderDarkActual += 1;
    }
  }
  index.search('');
  const views = index.recount({ attribute: ['DARK'] });
  index.search('dark magician');
  const darkMagicianByName = index.hasId(46986420);
  index.search('46986420');
  const darkMagicianByPasscode = index.hasId(46986420);
  index.search('86066372');
  const accesscodeByPasscode = index.hasId(86066372);
  return {
    cardCount: index.count,
    darkMagicianByName,
    darkMagicianByPasscode,
    accesscodeByPasscode,
    darkRecount: optionCount(views, 'attribute', 'DARK'),
    darkActual,
    spellcasterUnderDarkRecount: optionCount(views, 'race', 'Spellcaster'),
    spellcasterUnderDarkActual,
  };
}

function groupProbe(index: SearchIndex): GroupProbe[] {
  index.search('');
  const probes: GroupProbe[] = [];
  const groups = Object.keys(index.facetSizes) as (keyof typeof index.facetSizes)[];
  for (const group of groups) {
    const start = now();
    index.recount({}, [group]);
    probes.push({
      group,
      options: index.facetSizes[group],
      ms: now() - start,
    });
  }
  return probes;
}

export async function runS01(reps: BenchReps): Promise<BenchRun> {
  const cards = await loadCards();
  collectGarbage();
  const heapBefore = usedHeap();

  let index = new SearchIndex(cards);
  collectGarbage();
  const buildSamples: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = now();
    index = new SearchIndex(cards);
    buildSamples.push(now() - start);
    collectGarbage();
  }
  const heapAfter = usedHeap();
  const checks = checksFor(index, cards);

  runKeystrokes(index, 1, [], { ms: 0, label: '' });
  runFacets(index, 1, [], { ms: 0, label: '' });

  const keystrokeSamples: number[] = [];
  const facetSamples: number[] = [];
  const slowestKeystroke = runKeystrokes(index, reps.keystroke, keystrokeSamples, {
    ms: 0,
    label: '',
  });
  const slowestFacet = runFacets(index, reps.facet, facetSamples, { ms: 0, label: '' });

  const keystrokeOnScreenSamples: number[] = [];
  const facetOnScreenSamples: number[] = [];
  runKeystrokes(
    index,
    reps.keystroke,
    keystrokeOnScreenSamples,
    { ms: 0, label: '' },
    ON_SCREEN_GROUPS,
  );
  runFacets(index, reps.facet, facetOnScreenSamples, { ms: 0, label: '' }, ON_SCREEN_GROUPS);

  const searchOnlySamples: number[] = [];
  for (let rep = 0; rep < reps.keystroke; rep++) {
    for (const series of KEYSTROKE_SERIES) {
      for (let i = 1; i <= series.text.length; i++) {
        const query = series.text.slice(0, i);
        const start = now();
        index.search(query);
        const ids = index.collectShown(series.selected, 50);
        const elapsed = now() - start;
        touch(ids, []);
        searchOnlySamples.push(elapsed);
      }
    }
  }

  const recountOnlySamples: number[] = [];
  for (let rep = 0; rep < reps.facet; rep++) {
    for (const step of FACET_STEPS) {
      index.search(step.query);
      const start = now();
      const groups = index.recount(step.selected);
      const elapsed = now() - start;
      touch([], groups);
      recountOnlySamples.push(elapsed);
    }
  }

  const probe = groupProbe(index);
  const bitsetGzipBytes = await gzipSize(index.packBitsets());
  const nav = globalThis.navigator as Navigator & { deviceMemory?: number };

  return {
    cardCount: index.count,
    buildSamples,
    heapBefore,
    heapAfter,
    bitsetBytes: index.bitsetBytes,
    bitsetGzipBytes,
    trigramCount: index.trigramCount,
    tokenCount: index.tokenCount,
    facetSizes: { ...index.facetSizes },
    keystrokeSamples,
    facetSamples,
    keystrokeOnScreenSamples,
    facetOnScreenSamples,
    searchOnlySamples,
    recountOnlySamples,
    slowestKeystroke,
    slowestFacet,
    groupProbe: probe,
    sink,
    checks,
    viewport: { width: globalThis.innerWidth, height: globalThis.innerHeight },
    visualViewport: globalThis.visualViewport
      ? { width: globalThis.visualViewport.width, height: globalThis.visualViewport.height }
      : null,
    screen: { width: globalThis.screen.width, height: globalThis.screen.height },
    devicePixelRatio: globalThis.devicePixelRatio,
    userAgent: nav.userAgent,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory ?? null,
  };
}

const host = globalThis as typeof globalThis & { runS01?: typeof runS01 };
host.runS01 = runS01;
