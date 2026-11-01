import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  fetchPointerUntilExpected,
  nextPointerRetryBackoffMs,
  pickCardWithArtifactSmallImage,
  pointersMatch,
  runPagesPublishedDataSmoke,
  withCacheBust,
} from '../../scripts/pagesPublishedDataSmoke.ts';

describe('pages published data smoke helpers', () => {
  it('adds a cache-busting query parameter', () => {
    expect(withCacheBust('https://example.com/otcp/data/current.json', 123)).toBe(
      'https://example.com/otcp/data/current.json?t=123',
    );
  });

  it('matches pointers on datasetFile only', () => {
    expect(
      pointersMatch(
        {
          schemaVersion: '1.0.0',
          datasetFile: 'data/datasets/cards-new.json',
          sha256: 'abc',
          publishedAt: '2026-11-01T00:00:00.000Z',
          cardCount: 10,
        },
        'data/datasets/cards-new.json',
      ),
    ).toBe(true);
    expect(
      pointersMatch(
        {
          schemaVersion: '1.0.0',
          datasetFile: 'data/datasets/cards-old.json',
          sha256: 'abc',
          publishedAt: '2026-11-01T00:00:00.000Z',
          cardCount: 10,
        },
        'data/datasets/cards-new.json',
      ),
    ).toBe(false);
  });

  it('caps pointer retry backoff', () => {
    expect(nextPointerRetryBackoffMs(1)).toBe(5_000);
    expect(nextPointerRetryBackoffMs(6)).toBe(30_000);
  });

  it('skips cards whose small image is not in the artifact', () => {
    const artifact = new Set(['89631139.jpg']);
    const cards = [
      { images: { small: '/otcp/card-images/small/149694341.jpg' } },
      { images: { small: '/otcp/card-images/small/89631139.jpg' } },
    ];
    expect(pickCardWithArtifactSmallImage(cards, artifact)?.images.small).toBe(
      '/otcp/card-images/small/89631139.jpg',
    );
  });
});

describe('fetchPointerUntilExpected', () => {
  it('retries until the live pointer matches the expected dataset file', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schemaVersion: '1.0.0',
          datasetFile: 'data/datasets/cards-old.json',
          sha256: 'old',
          publishedAt: '2026-11-01T17:00:00.000Z',
          cardCount: 100,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schemaVersion: '1.0.0',
          datasetFile: 'data/datasets/cards-new.json',
          sha256: 'new',
          publishedAt: '2026-11-01T18:00:00.000Z',
          cardCount: 100,
        }),
      });

    let nowMs = 0;
    const sleep = vi.fn(async () => {
      nowMs += 5_000;
    });

    const pointer = await fetchPointerUntilExpected({
      pointerUrl: 'https://example.com/otcp/data/current.json',
      expectedDatasetFile: 'data/datasets/cards-new.json',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => nowMs,
      sleep,
      budgetMs: 60_000,
    });

    expect(pointer.datasetFile).toBe('data/datasets/cards-new.json');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0]?.[0]).toContain('t=0');
    expect(fetchImpl.mock.calls[0]?.[1]).toEqual({
      headers: { 'Cache-Control': 'no-cache' },
    });
    expect(sleep).toHaveBeenCalledOnce();
  });

  it('fails when the pointer never matches within the retry budget', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: '1.0.0',
        datasetFile: 'data/datasets/cards-old.json',
        sha256: 'old',
        publishedAt: '2026-11-01T17:00:00.000Z',
        cardCount: 100,
      }),
    });

    let nowMs = 0;
    const sleep = vi.fn(async () => {
      nowMs += 5_000;
    });

    await expect(
      fetchPointerUntilExpected({
        pointerUrl: 'https://example.com/otcp/data/current.json',
        expectedDatasetFile: 'data/datasets/cards-new.json',
        fetchImpl: fetchImpl as unknown as typeof fetch,
        now: () => nowMs,
        sleep,
        budgetMs: 12_000,
        initialBackoffMs: 5_000,
      }),
    ).rejects.toThrow(/expected data\/datasets\/cards-new\.json/);
  });
});

describe('runPagesPublishedDataSmoke', () => {
  it('fails when the verified card image is missing after the pointer matches', async () => {
    const sampleDataset = JSON.parse(
      readFileSync(join(process.cwd(), 'public/data/datasets/sample-dev.json'), 'utf8'),
    ) as {
      schemaVersion: string;
      generatedAt: string;
      source: string;
      cards: unknown[];
    };
    const extraCard = JSON.parse(
      readFileSync(join(process.cwd(), 'tests/fixtures/schema/link-monster.json'), 'utf8'),
    );
    const cards = [...sampleDataset.cards, extraCard];

    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('current.json')) {
        return {
          ok: true,
          json: async () => ({
            schemaVersion: '1.0.0',
            datasetFile: 'data/datasets/cards-live.json',
            sha256: 'live',
            publishedAt: '2026-11-01T18:00:00.000Z',
            cardCount: cards.length,
          }),
        };
      }
      if (url.includes('cards-live.json')) {
        return {
          ok: true,
          json: async () => ({
            schemaVersion: sampleDataset.schemaVersion,
            generatedAt: sampleDataset.generatedAt,
            source: sampleDataset.source,
            cards,
          }),
        };
      }
      if (init?.method === 'HEAD') {
        return { ok: false, status: 404 };
      }
      throw new Error(`Unexpected fetch ${url}`);
    });

    await expect(
      runPagesPublishedDataSmoke({
        baseUrl: 'https://example.com/otcp/',
        expectedDatasetFile: 'data/datasets/cards-live.json',
        fetchImpl: fetchImpl as unknown as typeof fetch,
        publishedArtifactPublicDir: undefined,
        now: () => 1,
        sleep: async () => {},
      }),
    ).rejects.toThrow(/Card image HEAD .* failed \(404\)/);
  });
});
