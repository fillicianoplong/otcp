import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearCardCatalogCache,
  fetchCardCatalog,
  getCardCatalog,
  loadCardCatalog,
} from '../../src/catalog/loadCatalog.ts';
import { OTCP_DATASET_SCHEMA_VERSION } from '../../src/shared/schema/constants.ts';
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
  it('loads a valid pointer and dataset', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'data/current.json': () =>
          jsonResponse({
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
            datasetFile: 'public/data/datasets/sample-dev.json',
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
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
            datasetFile: 'public/data/datasets/bad.json',
            sha256: 'abc',
            publishedAt: '2026-10-28T12:00:00.000Z',
            cardCount: 1,
          }),
        'data/datasets/bad.json': () =>
          jsonResponse({
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
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
          schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
          datasetFile: 'public/data/datasets/sample-dev.json',
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
});
