import type { PublishedPointer } from '../../pipeline/pointer.ts';
import { OTCP_DATASET_SCHEMA_VERSION } from '../shared/schema/constants.ts';
import type { YugiohCard } from '../shared/schema/card.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import { normalizeYugiohCardLevelRankLink } from '../shared/schema/normalizeMonsterLevelRankLink.ts';
import { validateDatasetEnvelope } from '../shared/schema/validate.ts';
import { CURRENT_POINTER_URL, publicDataUrl } from './paths.ts';

export type CatalogState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; cards: YugiohCard[]; generatedAt: string; setIndex?: SetIndex }
  | { status: 'error'; message: string };

type CatalogCache = Exclude<CatalogState, { status: 'loading' }>;

let cached: CatalogCache | null = null;
let inflight: Promise<CatalogCache> | null = null;

function isPublishedPointer(value: unknown): value is PublishedPointer {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.schemaVersion === OTCP_DATASET_SCHEMA_VERSION &&
    typeof record.datasetFile === 'string' &&
    record.datasetFile.length > 0
  );
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Response was not valid JSON.');
  }
}

export async function loadCardCatalog(fetchImpl: typeof fetch = fetch): Promise<CatalogCache> {
  const pointerResponse = await fetchImpl(CURRENT_POINTER_URL);
  if (pointerResponse.status === 404) {
    return { status: 'empty' };
  }
  if (!pointerResponse.ok) {
    throw new Error(`Could not load the catalog index (${pointerResponse.status}).`);
  }

  const pointerJson = await readJson(pointerResponse);
  if (!isPublishedPointer(pointerJson)) {
    throw new Error('The catalog index was missing required fields.');
  }

  const datasetUrl = publicDataUrl(pointerJson.datasetFile);
  const datasetResponse = await fetchImpl(datasetUrl);
  if (!datasetResponse.ok) {
    throw new Error(`Could not load the card dataset (${datasetResponse.status}).`);
  }

  const datasetJson = await readJson(datasetResponse);
  const validated = validateDatasetEnvelope(datasetJson);
  if (!validated.ok) {
    throw new Error('The published card dataset failed validation.');
  }

  if (validated.data.cards.length === 0) {
    return { status: 'empty' };
  }

  return {
    status: 'ready',
    cards: validated.data.cards.map(normalizeYugiohCardLevelRankLink),
    generatedAt: validated.data.generatedAt,
    ...(validated.data.setIndex ? { setIndex: validated.data.setIndex } : {}),
  };
}

export async function fetchCardCatalog(fetchImpl: typeof fetch = fetch): Promise<CatalogCache> {
  try {
    return await loadCardCatalog(fetchImpl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'The card catalog could not be loaded.';
    return { status: 'error', message };
  }
}

/** Session cache: one load for the app lifetime unless cleared. */
export function getCardCatalog(fetchImpl: typeof fetch = fetch): Promise<CatalogCache> {
  if (cached) {
    return Promise.resolve(cached);
  }
  if (!inflight) {
    inflight = fetchCardCatalog(fetchImpl).then((result) => {
      cached = result;
      inflight = null;
      return result;
    });
  }
  return inflight;
}

export function clearCardCatalogCache(): void {
  cached = null;
  inflight = null;
}

export async function reloadCardCatalog(fetchImpl: typeof fetch = fetch): Promise<CatalogCache> {
  clearCardCatalogCache();
  const result = await fetchCardCatalog(fetchImpl);
  cached = result;
  return result;
}

export function peekCardCatalogCache(): CatalogCache | null {
  return cached;
}
