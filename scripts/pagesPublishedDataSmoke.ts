import { isPublishedPointerLegacy, type PublishedPointer } from '../pipeline/pointer.ts';
import { publishedImagePaths } from '../pipeline/imagePaths.ts';
import { isCompactSearchIndexEnvelope } from '../src/shared/schema/compactSearchIndex.ts';
import {
  validateCompactSearchIndexEnvelope,
  validateDatasetEnvelope,
} from '../src/shared/schema/validate.ts';

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

export function publishedCatalogFile(pointer: PublishedPointer): string {
  if (isPublishedPointerLegacy(pointer)) return pointer.datasetFile;
  return pointer.searchIndexFile;
}

export function isSamplePointer(pointer: PublishedPointer): boolean {
  const catalogFile = publishedCatalogFile(pointer);
  return (
    catalogFile.includes('sample-dev') ||
    pointer.cardCount <= 4 ||
    catalogFile.endsWith('/sample-dev.json')
  );
}

export function withCacheBust(url: string, nonce: number): string {
  const parsed = new URL(url);
  parsed.searchParams.set('t', String(nonce));
  return parsed.href;
}

export function pointersMatch(pointer: PublishedPointer, expectedDatasetFile: string): boolean {
  return publishedCatalogFile(pointer) === expectedDatasetFile;
}

export function nextPointerRetryBackoffMs(
  attempt: number,
  initialBackoffMs = POINTER_RETRY_INITIAL_BACKOFF_MS,
  maxBackoffMs = POINTER_RETRY_MAX_BACKOFF_MS,
): number {
  return Math.min(initialBackoffMs * attempt, maxBackoffMs);
}

export function pickCardWithRemoteSmallImage(
  cards: Array<{ images?: { small?: string } }>,
): { images: { small: string } } | null {
  for (const card of cards) {
    const small = card.images?.small;
    if (!small || !/^https?:\/\//.test(small)) continue;
    return { images: { small } };
  }
  return null;
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
    if (!publishedCatalogFile(pointer)) {
      throw new Error('current.json is missing a published catalog file reference.');
    }
    if (pointersMatch(pointer, options.expectedDatasetFile)) {
      return pointer;
    }

    const elapsed = options.now() - start;
    const backoffMs = nextPointerRetryBackoffMs(attempt, initialBackoffMs);
    if (elapsed + backoffMs > budgetMs) {
      throw new Error(
        `Published pointer still ${publishedCatalogFile(pointer)} after ${Math.round(elapsed / 1000)}s; expected ${options.expectedDatasetFile}.`,
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
  if (!publishedCatalogFile(pointer)) {
    throw new Error('current.json is missing a published catalog file reference.');
  }
  return pointer;
}

export async function runPagesPublishedDataSmoke(options: {
  baseUrl: string;
  fetchImpl?: SmokeFetch;
  expectedDatasetFile?: string;
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

  const datasetUrl = siteUrl(base, publishedCatalogFile(pointer));
  const datasetJson = await fetchPublishedJson(datasetUrl, fetchImpl, now());
  let cardCount: number;
  let cardsForImageSmoke: Array<{ images?: { small?: string } }> | undefined;
  let compactFirstCardId: number | undefined;
  if (isCompactSearchIndexEnvelope(datasetJson)) {
    const validated = validateCompactSearchIndexEnvelope(datasetJson);
    if (!validated.ok) {
      throw new Error('Published catalog failed schema validation.');
    }
    cardCount = validated.data.i.length;
    compactFirstCardId = validated.data.i[0];
  } else {
    const validated = validateDatasetEnvelope(datasetJson);
    if (!validated.ok) {
      throw new Error('Published catalog failed schema validation.');
    }
    cardCount = validated.data.cards.length;
    cardsForImageSmoke = validated.data.cards;
  }

  log(`Published catalog OK (${cardCount} cards, pointer ${publishedCatalogFile(pointer)}).`);

  if (isSamplePointer(pointer)) {
    log('Sample pointer still live; skipping image and full-count checks.');
    return;
  }

  if (cardCount < pointer.cardCount) {
    throw new Error(
      `Dataset card count (${cardCount}) is below pointer cardCount (${pointer.cardCount}).`,
    );
  }

  const cardWithArt = pickCardWithRemoteSmallImage(cardsForImageSmoke ?? []);
  const imageUrl =
    cardWithArt?.images?.small ??
    (compactFirstCardId != null ? publishedImagePaths(compactFirstCardId).small : undefined);
  if (!imageUrl) {
    throw new Error('No R2 small image URL found in the published dataset to verify.');
  }

  const imageResponse = await fetchPublishedHead(imageUrl, fetchImpl, now());
  if (!imageResponse.ok) {
    throw new Error(`Card image HEAD ${imageUrl} failed (${imageResponse.status}).`);
  }

  log(`Card image OK (${imageUrl}).`);
}

/** @deprecated Artifact small images are no longer deployed to Pages. */
export function pickCardWithArtifactSmallImage(
  cards: Array<{ images?: { small?: string } }>,
): { images: { small: string } } | null {
  return pickCardWithRemoteSmallImage(cards);
}
