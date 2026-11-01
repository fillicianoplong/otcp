import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { resolveDatasetRepoPath, type PublishedPointer } from '../pipeline/pointer.ts';
import { validateDatasetEnvelope } from '../src/shared/schema/validate.ts';

export type SmokeFetch = typeof fetch;

export const POINTER_RETRY_BUDGET_MS = 3 * 60 * 1000;
export const POINTER_RETRY_INITIAL_BACKOFF_MS = 5_000;
export const POINTER_RETRY_MAX_BACKOFF_MS = 30_000;

export function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('BASE_URL is required.');
  }
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export function siteUrl(base: string, path: string): string {
  const withoutLeadingSlash = path.replace(/^\//, '');
  return new URL(withoutLeadingSlash, base).href;
}

export function isSamplePointer(pointer: PublishedPointer): boolean {
  return (
    pointer.datasetFile.includes('sample-dev') ||
    pointer.cardCount <= 4 ||
    pointer.datasetFile.endsWith('/sample-dev.json')
  );
}

export function withCacheBust(url: string, nonce: number): string {
  const parsed = new URL(url);
  parsed.searchParams.set('t', String(nonce));
  return parsed.href;
}

export function pointersMatch(pointer: PublishedPointer, expectedDatasetFile: string): boolean {
  return pointer.datasetFile === expectedDatasetFile;
}

export function nextPointerRetryBackoffMs(
  attempt: number,
  initialBackoffMs = POINTER_RETRY_INITIAL_BACKOFF_MS,
  maxBackoffMs = POINTER_RETRY_MAX_BACKOFF_MS,
): number {
  return Math.min(initialBackoffMs * attempt, maxBackoffMs);
}

export function imageBasenameFromSitePath(sitePath: string): string {
  const normalized = sitePath.replace(/^\/otcp\//, '');
  const parts = normalized.split('/');
  return parts[parts.length - 1] ?? sitePath;
}

export function pickCardWithArtifactSmallImage(
  cards: Array<{ images?: { small?: string } }>,
  artifactSmallBasenames: Set<string> | null,
): { images: { small: string } } | null {
  for (const card of cards) {
    const small = card.images?.small;
    if (!small) continue;
    const basename = imageBasenameFromSitePath(small);
    if (artifactSmallBasenames === null || artifactSmallBasenames.has(basename)) {
      return { images: { small } };
    }
  }
  return null;
}

export function loadArtifactSmallImageBasenames(publicDir: string | undefined): Set<string> | null {
  if (!publicDir?.trim()) {
    return null;
  }
  const smallDir = join(publicDir, 'card-images/small');
  if (!existsSync(smallDir)) {
    return new Set();
  }
  return new Set(readdirSync(smallDir));
}

export function loadArtifactDatasetCards(
  publicDir: string | undefined,
  datasetFile: string,
): Array<{ images?: { small?: string } }> | null {
  if (!publicDir?.trim()) {
    return null;
  }
  const repoRoot = dirname(publicDir);
  const datasetPath = resolveDatasetRepoPath(repoRoot, datasetFile);
  const raw = JSON.parse(readFileSync(datasetPath, 'utf8')) as unknown;
  const validated = validateDatasetEnvelope(raw);
  if (!validated.ok) {
    throw new Error('Expected dataset in the deploy artifact failed schema validation.');
  }
  return validated.data.cards;
}

export async function fetchPublishedJson(
  url: string,
  fetchImpl: SmokeFetch,
  nonce: number,
): Promise<unknown> {
  const response = await fetchImpl(withCacheBust(url, nonce), {
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed (${response.status}).`);
  }
  return response.json();
}

export async function fetchPublishedHead(
  url: string,
  fetchImpl: SmokeFetch,
  nonce: number,
): Promise<Response> {
  return fetchImpl(withCacheBust(url, nonce), {
    method: 'HEAD',
    headers: { 'Cache-Control': 'no-cache' },
  });
}

export async function fetchPointerUntilExpected(options: {
  pointerUrl: string;
  expectedDatasetFile: string;
  fetchImpl: SmokeFetch;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  budgetMs?: number;
  initialBackoffMs?: number;
}): Promise<PublishedPointer> {
  const budgetMs = options.budgetMs ?? POINTER_RETRY_BUDGET_MS;
  const initialBackoffMs = options.initialBackoffMs ?? POINTER_RETRY_INITIAL_BACKOFF_MS;
  const start = options.now();
  let attempt = 0;

  while (true) {
    attempt += 1;
    const nonce = options.now();
    const json = await fetchPublishedJson(options.pointerUrl, options.fetchImpl, nonce);
    const pointer = json as PublishedPointer;
    if (typeof pointer.datasetFile !== 'string' || pointer.datasetFile.length === 0) {
      throw new Error('current.json is missing datasetFile.');
    }
    if (pointersMatch(pointer, options.expectedDatasetFile)) {
      return pointer;
    }

    const elapsed = options.now() - start;
    const backoffMs = nextPointerRetryBackoffMs(attempt, initialBackoffMs);
    if (elapsed + backoffMs > budgetMs) {
      throw new Error(
        `Published pointer still ${pointer.datasetFile} after ${Math.round(elapsed / 1000)}s; expected ${options.expectedDatasetFile}.`,
      );
    }
    await options.sleep(backoffMs);
  }
}

async function fetchLivePointer(
  pointerUrl: string,
  fetchImpl: SmokeFetch,
  now: () => number,
): Promise<PublishedPointer> {
  const json = await fetchPublishedJson(pointerUrl, fetchImpl, now());
  const pointer = json as PublishedPointer;
  if (typeof pointer.datasetFile !== 'string' || pointer.datasetFile.length === 0) {
    throw new Error('current.json is missing datasetFile.');
  }
  return pointer;
}

export async function runPagesPublishedDataSmoke(options: {
  baseUrl: string;
  fetchImpl?: SmokeFetch;
  expectedDatasetFile?: string;
  publishedArtifactPublicDir?: string;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  log?: (message: string) => void;
}): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const sleep =
    options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const log = options.log ?? console.log;

  const base = normalizeBaseUrl(options.baseUrl);
  const pointerUrl = siteUrl(base, 'data/current.json');
  const expectedDatasetFile = options.expectedDatasetFile?.trim();

  const pointer =
    expectedDatasetFile && expectedDatasetFile.length > 0
      ? await fetchPointerUntilExpected({
          pointerUrl,
          expectedDatasetFile,
          fetchImpl,
          now,
          sleep,
        })
      : await fetchLivePointer(pointerUrl, fetchImpl, now);

  const datasetUrl = siteUrl(base, pointer.datasetFile);
  const datasetJson = await fetchPublishedJson(datasetUrl, fetchImpl, now());
  const validated = validateDatasetEnvelope(datasetJson);
  if (!validated.ok) {
    throw new Error('Published dataset failed schema validation.');
  }

  log(
    `Published dataset OK (${validated.data.cards.length} cards, pointer ${pointer.datasetFile}).`,
  );

  if (isSamplePointer(pointer)) {
    log('Sample pointer still live; skipping image and full-count checks.');
    return;
  }

  if (validated.data.cards.length < pointer.cardCount) {
    throw new Error(
      `Dataset card count (${validated.data.cards.length}) is below pointer cardCount (${pointer.cardCount}).`,
    );
  }

  const artifactBasenames = loadArtifactSmallImageBasenames(options.publishedArtifactPublicDir);
  const artifactCards =
    expectedDatasetFile && expectedDatasetFile.length > 0
      ? loadArtifactDatasetCards(options.publishedArtifactPublicDir, expectedDatasetFile)
      : null;
  const cardsForImagePick = artifactCards ?? validated.data.cards;

  const cardWithArt = pickCardWithArtifactSmallImage(cardsForImagePick, artifactBasenames);
  if (!cardWithArt?.images?.small) {
    throw new Error('No re-hosted card image found in the deploy artifact to verify.');
  }

  const imagePath = cardWithArt.images.small.replace(/^\/otcp\//, '');
  const imageUrl = siteUrl(base, imagePath);
  const imageResponse = await fetchPublishedHead(imageUrl, fetchImpl, now());
  if (!imageResponse.ok) {
    throw new Error(`Card image HEAD ${imageUrl} failed (${imageResponse.status}).`);
  }

  log(`Card image OK (${imageUrl}).`);
}
