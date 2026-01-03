import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, platform, release, totalmem } from 'node:os';
import { gzipSync } from 'node:zlib';
import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { trimCard } from './src/cards.ts';
import { summarize, type Summary } from './src/stats.ts';
import { PUBLISHED_FIELDS, type ApiCard, type TrimmedCard } from './src/types.ts';
import type { BenchChecks, BenchRun, GroupProbe, SlowSample } from './bench-main.ts';

const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes';
const TARGET_MS = 100;
const SPIN_ITERS = 8_000_000;

type Spin = { ms: number; sink: number };

type RateReport = {
  rate: number;
  calibrationMs: number;
  build: Summary;
  keystroke: Summary;
  facet: Summary;
  keystrokeOnScreen: Summary;
  facetOnScreen: Summary;
  searchOnly: Summary;
  recountOnly: Summary;
  slowestKeystroke: SlowSample;
  slowestFacet: SlowSample;
  groupProbe: GroupProbe[];
  heapBefore: number | null;
  heapAfter: number | null;
  heapDelta: number | null;
  bitsetGzipBytes: number;
  sink: number;
  checks: BenchChecks;
  samples: {
    build: number[];
    keystroke: number[];
    facet: number[];
    keystrokeOnScreen: number[];
    facetOnScreen: number[];
    searchOnly: number[];
    recountOnly: number[];
  };
};

function reps(): { keystroke: number; facet: number } {
  return {
    keystroke: Number(process.env.S01_KEY_REPS ?? 3),
    facet: Number(process.env.S01_FACET_REPS ?? 8),
  };
}

async function loadTrimmedCards(): Promise<TrimmedCard[]> {
  const file = process.env.S01_CARDS_FILE;
  if (file) {
    const raw = JSON.parse(await readFile(file, 'utf8')) as { data: ApiCard[] };
    return raw.data.map(trimCard);
  }

  let last: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(API_URL, { signal: AbortSignal.timeout(120_000) });
      if (!response.ok) throw new Error(`card API ${response.status}`);
      const raw = (await response.json()) as { data: ApiCard[] };
      return raw.data.map(trimCard);
    } catch (error) {
      last = error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
  throw last;
}

async function spin(page: Page): Promise<number> {
  const result = await page.evaluate((iters: number): Spin => {
    const start = performance.now();
    let sink = 0;
    for (let i = 0; i < iters; i++) sink = (sink + i) | 0;
    return { ms: performance.now() - start, sink };
  }, SPIN_ITERS);
  expect(Number.isFinite(result.sink)).toBe(true);
  return result.ms;
}

async function setRate(session: CDPSession, rate: number): Promise<void> {
  await session.send('Emulation.setCPUThrottlingRate', { rate });
}

async function measure(page: Page): Promise<BenchRun> {
  const run = await page.evaluate(async (count) => {
    const host = globalThis as typeof globalThis & {
      runS01?: (value: { keystroke: number; facet: number }) => Promise<BenchRun>;
    };
    if (!host.runS01) throw new Error('runS01 is not loaded');
    return host.runS01(count);
  }, reps());
  expect(run.cardCount).toBeGreaterThan(0);
  expect(run.viewport.width).toBeGreaterThan(0);
  return run;
}

function report(rate: number, calibrationMs: number, run: BenchRun): RateReport {
  const heapDelta =
    run.heapBefore !== null && run.heapAfter !== null ? run.heapAfter - run.heapBefore : null;
  return {
    rate,
    calibrationMs,
    build: summarize(run.buildSamples),
    keystroke: summarize(run.keystrokeSamples),
    facet: summarize(run.facetSamples),
    keystrokeOnScreen: summarize(run.keystrokeOnScreenSamples),
    facetOnScreen: summarize(run.facetOnScreenSamples),
    searchOnly: summarize(run.searchOnlySamples),
    recountOnly: summarize(run.recountOnlySamples),
    slowestKeystroke: run.slowestKeystroke,
    slowestFacet: run.slowestFacet,
    groupProbe: run.groupProbe,
    heapBefore: run.heapBefore,
    heapAfter: run.heapAfter,
    heapDelta,
    bitsetGzipBytes: run.bitsetGzipBytes,
    sink: run.sink,
    checks: run.checks,
    samples: {
      build: run.buildSamples,
      keystroke: run.keystrokeSamples,
      facet: run.facetSamples,
      keystrokeOnScreen: run.keystrokeOnScreenSamples,
      facetOnScreen: run.facetOnScreenSamples,
      searchOnly: run.searchOnlySamples,
      recountOnly: run.recountOnlySamples,
    },
  };
}

function meetsTarget(summary: Summary): boolean {
  return summary.n > 0 && summary.max <= TARGET_MS;
}

test('S-01 search and facet recount under CPU throttle', async ({ page, browser }) => {
  test.setTimeout(600_000);
  const cards = await loadTrimmedCards();
  const publishedJson = JSON.stringify(cards);
  const publishedJsonBytes = Buffer.byteLength(publishedJson);
  const publishedJsonGzipBytes = gzipSync(publishedJson, { level: 9 }).length;

  await page.route('**/cards.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: publishedJson,
    });
  });

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/bench.html');
  const session = await page.context().newCDPSession(page);
  const hasGc = await page.evaluate(
    () => typeof (globalThis as { gc?: unknown }).gc === 'function',
  );
  expect(hasGc).toBe(true);

  await setRate(session, 1);
  const calibration1 = await spin(page);
  await setRate(session, 4);
  const calibration4 = await spin(page);
  const run4 = await measure(page);
  await setRate(session, 6);
  const calibration6 = await spin(page);
  const run6 = await measure(page);

  expect(errors, errors.join('\n')).toEqual([]);

  const rate4 = report(4, calibration4, run4);
  const rate6 = report(6, calibration6, run6);
  const pass =
    meetsTarget(rate4.keystroke) &&
    meetsTarget(rate4.facet) &&
    meetsTarget(rate6.keystroke) &&
    meetsTarget(rate6.facet);

  const cpu = cpus()[0];
  const results = {
    emulation: true,
    emulationNote:
      'CPU throttling via Chrome DevTools Protocol Emulation.setCPUThrottlingRate. This is not a measurement on the reference phone.',
    targetMs: TARGET_MS,
    pass,
    rule: 'Pass when the max sample for keystroke (search + full facet recount + first 50 ids) and for facet change stays at or under 100 ms at both 4x and 6x.',
    percentile: 'Nearest rank. p50 is rank ceil(0.50*n). p95 is rank ceil(0.95*n).',
    capturedAt: new Date().toISOString(),
    source: API_URL,
    cardsFile: process.env.S01_CARDS_FILE || null,
    dataset: {
      cardCount: cards.length,
      publishedFields: PUBLISHED_FIELDS,
      publishedJsonBytes,
      publishedJsonGzipBytes,
      gzipLevel: 9,
    },
    index: {
      trigramCount: run4.trigramCount,
      tokenCount: run4.tokenCount,
      facetSizes: run4.facetSizes,
      bitsetBytes: run4.bitsetBytes,
      bitsetGzipBytes: run4.bitsetGzipBytes,
      bitsetGzipNote:
        'Browser CompressionStream gzip of the packed bitset bytes. Default gzip level, not level 9.',
      heapBefore: run4.heapBefore,
      heapAfter: run4.heapAfter,
      heapDelta: rate4.heapDelta,
    },
    environment: {
      os: `${platform()} ${release()}`,
      cpu: cpu?.model ?? 'unknown',
      cpuCores: cpus().length,
      totalMemBytes: totalmem(),
      node: process.version,
      chromium: browser.version(),
      userAgent: run4.userAgent,
      viewport: run4.viewport,
      visualViewport: run4.visualViewport,
      screen: run4.screen,
      devicePixelRatio: run4.devicePixelRatio,
      playwrightViewport: page.viewportSize(),
      hardwareConcurrency: run4.hardwareConcurrency,
      deviceMemoryGb: run4.deviceMemory,
      device: 'Pixel 5 viewport and user agent (Playwright device descriptor)',
      spinIters: SPIN_ITERS,
      calibrationMs: { 1: calibration1, 4: calibration4, 6: calibration6 },
      reps: reps(),
    },
    rates: { 4: rate4, 6: rate6 },
  };

  await mkdir(new URL('./results/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('./results/s01-results.json', import.meta.url),
    `${JSON.stringify(results, null, 2)}\n`,
  );

  const fullSet = !process.env.S01_CARDS_FILE;
  if (fullSet) expect(run4.cardCount).toBeGreaterThan(10_000);
  expect(run4.checks.cardCount).toBe(cards.length);
  expect(run4.checks.darkRecount).toBe(run4.checks.darkActual);
  expect(run4.checks.spellcasterUnderDarkRecount).toBe(run4.checks.spellcasterUnderDarkActual);
  expect(run4.checks.darkMagicianByName).toBe(true);
  expect(run4.checks.darkMagicianByPasscode).toBe(true);
  if (fullSet) {
    expect(run4.checks.accesscodeByPasscode).toBe(true);
    expect(run4.checks.darkActual).toBeGreaterThan(2000);
  }
  expect(run6.checks.darkRecount).toBe(run6.checks.darkActual);
  expect(calibration4).toBeGreaterThan(calibration1 * 2);
  expect(calibration6).toBeGreaterThan(calibration4);
  expect(run4.sink).toBeGreaterThan(0);
  expect(rate4.keystroke.n).toBeGreaterThan(0);
  expect(rate4.facet.n).toBeGreaterThan(0);
});
