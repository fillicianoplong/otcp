import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { atomicWriteUtf8 } from '../../src/shared/fs/atomicWrite.ts';
import { OTCP_DATASET_SCHEMA_VERSION } from '../../src/shared/schema/constants.ts';
import { sha256Hex } from '../../pipeline/hash.ts';
import { localImagePath } from '../../pipeline/fetchCardImages.ts';
import { datasetFileToRepoRelative, type PublishedPointer } from '../../pipeline/pointer.ts';
import {
  defaultPipelinePaths,
  loadPublishedPointer,
  resolveDatasetPath,
  runPipeline,
} from '../../pipeline/runPipeline.ts';
import validFixture from '../fixtures/pipeline/ygoprodeck-valid-two.json';
import invalidFixture from '../fixtures/pipeline/ygoprodeck-invalid-name.json';

const CARD_IDS = [46986420, 89631139] as const;

function makeTempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'otcp-pipeline-'));
}

function imageResponse(body = Buffer.from([0xff, 0xd8, 0xff, 0xd9])): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'image/jpeg' },
  });
}

type MockFetchOptions = {
  cardDump?: unknown;
  failImageUrl?: (url: string) => boolean;
  onImageFetch?: (url: string) => void;
};

function createMockFetch(options: MockFetchOptions = {}): typeof fetch {
  const cardDump = options.cardDump ?? validFixture;
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('cardinfo.php')) {
      return new Response(JSON.stringify(cardDump), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('images.ygoprodeck.com')) {
      options.onImageFetch?.(url);
      if (options.failImageUrl?.(url)) {
        return new Response('nope', { status: 500 });
      }
      return imageResponse();
    }
    throw new Error(`unexpected fetch URL: ${url}`);
  }) as typeof fetch;
}

function seedImageWithSidecar(root: string, cardId: number, variant: 'large' | 'small'): void {
  const path = localImagePath(root, cardId, variant);
  mkdirSync(dirname(path), { recursive: true });
  const bytes = Buffer.from(`seed-${cardId}-${variant}`);
  writeFileSync(path, bytes);
  writeFileSync(`${path}.sha256`, `${sha256Hex(bytes)}\n`);
}

function seedPointer(root: string, cardCount = 1): PublishedPointer {
  const paths = defaultPipelinePaths(root);
  const priorDatasetRel = 'data/datasets/cards-prior.json';
  const priorEnvelope = {
    schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
    generatedAt: '2026-01-01T00:00:00.000Z',
    source: 'fixture',
    cards: [
      {
        schemaVersion: '1.0.0',
        id: 1,
        name: 'Prior',
        type: 'Normal Monster',
        text: 'unchanged',
        images: {
          small: '/otcp/card-images/small/1.jpg',
          large: '/otcp/card-images/1.jpg',
        },
        sets: [],
      },
    ],
  };
  const datasetPath = join(root, datasetFileToRepoRelative(priorDatasetRel));
  atomicWriteUtf8(datasetPath, `${JSON.stringify(priorEnvelope, null, 2)}\n`);
  const pointer: PublishedPointer = {
    schemaVersion: OTCP_DATASET_SCHEMA_VERSION,
    datasetFile: priorDatasetRel,
    sha256: 'prior-hash',
    publishedAt: '2026-01-01T00:00:00.000Z',
    cardCount,
  };
  atomicWriteUtf8(paths.pointerPath, `${JSON.stringify(pointer, null, 2)}\n`);
  return pointer;
}

describe('DataPipeline', () => {
  const roots: string[] = [];

  afterEach(() => {
    while (roots.length > 0) {
      const root = roots.pop();
      if (root) rmSync(root, { recursive: true, force: true });
    }
  });

  it('publishes a valid fetch and swaps the pointer atomically', async () => {
    const root = makeTempRoot();
    roots.push(root);
    const prior = seedPointer(root);
    const paths = defaultPipelinePaths(root);

    const result = await runPipeline(root, {
      now: () => new Date('2026-11-01T12:00:00.000Z'),
      fetch: { fetchImpl: createMockFetch() },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const pointer = loadPublishedPointer(root);
    expect(pointer?.datasetFile).not.toBe(prior.datasetFile);
    expect(pointer?.datasetFile).toMatch(/^data\/datasets\/cards-/);
    expect(pointer?.cardCount).toBe(2);
    expect(pointer?.sha256).toMatch(/^[a-f0-9]{64}$/);

    const datasetPath = resolveDatasetPath(root, pointer!);
    const datasetText = readFileSync(datasetPath, 'utf8');
    expect(datasetText).toContain('Dark Magician');
    expect(datasetText).not.toContain('images.ygoprodeck.com');
    expect(datasetText).toContain('/otcp/card-images/small/46986420.jpg');
    expect(readFileSync(paths.pointerPath, 'utf8')).toContain(pointer!.datasetFile);

    const datasets = readdirSync(paths.datasetsDir);
    expect(datasets.some((name) => name.startsWith('cards-2026-11-01'))).toBe(true);
  });

  it('keeps the prior pointer and dataset when a record fails validation', async () => {
    const root = makeTempRoot();
    roots.push(root);
    const prior = seedPointer(root);
    const paths = defaultPipelinePaths(root);
    const beforeDatasets = readdirSync(paths.datasetsDir);

    const result = await runPipeline(root, {
      fetch: {
        fetchImpl: createMockFetch({ cardDump: invalidFixture }),
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('validation');

    const pointer = loadPublishedPointer(root);
    expect(pointer?.datasetFile).toBe(prior.datasetFile);
    expect(pointer?.sha256).toBe(prior.sha256);
    expect(readdirSync(paths.datasetsDir)).toEqual(beforeDatasets);
    expect(readFileSync(resolveDatasetPath(root, prior), 'utf8')).toContain('unchanged');
  });

  it('keeps the prior pointer when fetch fails', async () => {
    const root = makeTempRoot();
    roots.push(root);
    const prior = seedPointer(root);
    const paths = defaultPipelinePaths(root);
    const beforeDatasets = readdirSync(paths.datasetsDir);

    const result = await runPipeline(root, {
      fetch: {
        maxAttempts: 1,
        fetchImpl: async () => {
          throw new Error('network down');
        },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('fetch');

    const pointer = loadPublishedPointer(root);
    expect(pointer?.datasetFile).toBe(prior.datasetFile);
    expect(readdirSync(paths.datasetsDir)).toEqual(beforeDatasets);
  });

  it('keeps the prior pointer when an image download fails', async () => {
    const root = makeTempRoot();
    roots.push(root);
    const prior = seedPointer(root);
    const paths = defaultPipelinePaths(root);
    const beforeDatasets = readdirSync(paths.datasetsDir);

    const result = await runPipeline(root, {
      fetch: {
        maxAttempts: 1,
        fetchImpl: createMockFetch({
          failImageUrl: (url) => url.includes('/46986420.jpg'),
        }),
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('images');

    const pointer = loadPublishedPointer(root);
    expect(pointer?.datasetFile).toBe(prior.datasetFile);
    expect(readdirSync(paths.datasetsDir)).toEqual(beforeDatasets);
  });

  it('skips upstream image fetches when hashed files already exist', async () => {
    const root = makeTempRoot();
    roots.push(root);
    seedPointer(root);

    for (const cardId of CARD_IDS) {
      seedImageWithSidecar(root, cardId, 'large');
      seedImageWithSidecar(root, cardId, 'small');
    }

    let imageFetches = 0;
    const result = await runPipeline(root, {
      now: () => new Date('2026-11-01T12:00:00.000Z'),
      fetch: {
        fetchImpl: createMockFetch({
          onImageFetch: () => {
            imageFetches += 1;
          },
        }),
      },
    });

    expect(result.ok).toBe(true);
    expect(imageFetches).toBe(0);
  });
});
