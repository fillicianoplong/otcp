import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearCardCatalogCache,
  fetchCardCatalog,
  getCardCatalog,
  loadCardCatalog,
} from '../../src/catalog/loadCatalog.ts';
import { encodeCompactSearchIndex } from '../../src/shared/schema/compactSearchIndex.ts';
import { OTCP_DATASET_SCHEMA_VERSION_LEGACY } from '../../src/shared/schema/constants.ts';
import { toCatalogSearchCard } from '../../pipeline/splitDataset.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import validDataset from '../fixtures/schema/dataset-valid.json';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch(handlers: Record<string, () => Response | Promise<Response>>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    for (const [needle, handler] of Object.entries(handlers)) {
      if (url.includes(needle)) {
        return handler();
      }
    }
    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;
}

afterEach(() => {
  clearCardCatalogCache();
  vi.unstubAllGlobals();
});

describe('loadCardCatalog', () => {
  it('loads a v2 split pointer and search index', async () => {
    const card = validDataset.cards[0] as YugiohCard;
    const searchIndex = encodeCompactSearchIndex(
      [toCatalogSearchCard(card, 0)],
      validDataset.generatedAt,
      validDataset.source,
    );
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'data/current.json': () =>
          jsonResponse({
            schemaVersion: '2.0.0',
            searchIndexFile: 'data/datasets/search-dev.json',
            searchIndexSha256: 'abc',
            detailsPrefix: 'data/datasets/details-dev/',
            detailsBucketSize: 500,
            detailBucketCount: 1,
            publishedAt: '2026-10-28T12:00:00.000Z',
            cardCount: 1,
          }),
        'data/datasets/search-dev.json': () => jsonResponse(searchIndex),
        'data/datasets/details-dev/bucket-00000.json': () =>
          jsonResponse({
            schemaVersion: '2.0.0',
            bucket: 0,
            cards: {
              '89631139': {
                text: validDataset.cards[0].text,
                sets: validDataset.cards[0].sets,
              },
            },
          }),
      }),
    );

    const result = await loadCardCatalog();
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.cards[0]?.text).toBe(validDataset.cards[0].text);
    expect(result.detailSource?.detailBucketCount).toBe(1);
  });

  it('loads a valid pointer and dataset', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'data/current.json': () =>
          jsonResponse({
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION_LEGACY,
            datasetFile: 'data/datasets/sample-dev.json',
            sha256: 'abc',
            publishedAt: '2026-10-28T12:00:00.000Z',
            cardCount: 1,
          }),
        'data/datasets/sample-dev.json': () => jsonResponse(validDataset),
      }),
    );

    const result = await loadCardCatalog();
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]?.name).toBe('Blue-Eyes White Dragon');
    expect(result.generatedAt).toBe('2026-10-28T12:00:00.000Z');
  });

  it('accepts legacy public/ datasetFile paths', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'data/current.json': () =>
          jsonResponse({
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION_LEGACY,
            datasetFile: 'data/datasets/sample-dev.json',
            sha256: 'abc',
            publishedAt: '2026-10-28T12:00:00.000Z',
            cardCount: 1,
          }),
        'data/datasets/sample-dev.json': () => jsonResponse(validDataset),
      }),
    );

    const result = await loadCardCatalog();
    expect(result.status).toBe('ready');
  });

  it('returns empty when the pointer is missing', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'data/current.json': () => new Response('', { status: 404 }),
      }),
    );

    const result = await loadCardCatalog();
    expect(result).toEqual({ status: 'empty' });
  });

  it('surfaces validation failure as an error state', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'data/current.json': () =>
          jsonResponse({
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION_LEGACY,
            datasetFile: 'public/data/datasets/bad.json',
            sha256: 'abc',
            publishedAt: '2026-10-28T12:00:00.000Z',
            cardCount: 1,
          }),
        'data/datasets/bad.json': () =>
          jsonResponse({
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION_LEGACY,
            generatedAt: '2026-10-28T12:00:00.000Z',
            source: 'bad',
            cards: [{ id: 1 }],
          }),
      }),
    );

    const result = await fetchCardCatalog();
    expect(result.status).toBe('error');
    if (result.status !== 'error') return;
    expect(result.message).toContain('validation');
  });
});

describe('getCardCatalog session cache', () => {
  it('fetches only once until the cache is cleared', async () => {
    const fetchImpl = mockFetch({
      'data/current.json': () =>
        jsonResponse({
          schemaVersion: OTCP_DATASET_SCHEMA_VERSION_LEGACY,
          datasetFile: 'data/datasets/sample-dev.json',
          sha256: 'abc',
          publishedAt: '2026-10-28T12:00:00.000Z',
          cardCount: 1,
        }),
      'data/datasets/sample-dev.json': () => jsonResponse(validDataset),
    });
    vi.stubGlobal('fetch', fetchImpl);

    await getCardCatalog();
    await getCardCatalog();

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('validates the dataset envelope only once per cached load', async () => {
    const validateSpy = vi.spyOn(
      await import('../../src/shared/schema/validate.ts'),
      'validateDatasetEnvelope',
    );
    const fetchImpl = mockFetch({
      'data/current.json': () =>
        jsonResponse({
          schemaVersion: OTCP_DATASET_SCHEMA_VERSION_LEGACY,
          datasetFile: 'data/datasets/sample-dev.json',
          sha256: 'abc',
          publishedAt: '2026-10-28T12:00:00.000Z',
          cardCount: 1,
        }),
      'data/datasets/sample-dev.json': () => jsonResponse(validDataset),
    });
    vi.stubGlobal('fetch', fetchImpl);

    await getCardCatalog();
    await getCardCatalog();

    expect(validateSpy).toHaveBeenCalledTimes(1);
    validateSpy.mockRestore();
  });
});
