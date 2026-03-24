import { ListObjectsV2Command, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { atomicWriteUtf8 } from '../../src/shared/fs/atomicWrite.ts';
import { OTCP_DATASET_SCHEMA_VERSION } from '../../src/shared/schema/constants.ts';
import { R2_CARD_IMAGES_PUBLIC_BASE_URL } from '../../pipeline/constants.ts';
import { r2LargeObjectKey, r2SmallObjectKey } from '../../pipeline/imagePaths.ts';
import { datasetFileToRepoRelative, type PublishedPointer } from '../../pipeline/pointer.ts';
import {
  defaultPipelinePaths,
  loadPublishedPointer,
  resolveDatasetPath,
  runPipeline,
} from '../../pipeline/runPipeline.ts';
import validFixture from '../fixtures/pipeline/ygoprodeck-valid-two.json';
import invalidFixture from '../fixtures/pipeline/ygoprodeck-invalid-name.json';
import placeholderFixture from '../fixtures/pipeline/ygoprodeck-placeholder-and-no-set.json';

const CARD_IDS = [46986420, 89631139] as const;

const R2_ENV = {
  R2_ACCOUNT_ID: 'acct',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
};

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

function createMockS3(initialKeys: string[] = []): S3Client {
  const keys = new Set(initialKeys);

  return {
    send: async (command: unknown) => {
      if (command instanceof ListObjectsV2Command) {
        const prefix = command.input.Prefix ?? '';
        return {
          Contents: [...keys].filter((Key) => Key.startsWith(prefix)).map((Key) => ({ Key })),
          IsTruncated: false,
        };
      }
      if (command instanceof PutObjectCommand) {
        if (command.input.Key) keys.add(command.input.Key);
        return {};
      }
      throw new Error(`unexpected S3 command: ${String(command)}`);
    },
  } as unknown as S3Client;
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
          small: `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/small/1.webp`,
          large: `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/large/1.webp`,
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
    expect(datasetText).toContain(`${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/small/46986420.webp`);
    expect(datasetText).toContain(`${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/large/46986420.webp`);
    expect(readFileSync(paths.pointerPath, 'utf8')).toContain(pointer!.datasetFile);

    const datasets = readdirSync(paths.datasetsDir);
    expect(datasets.some((name) => name.startsWith('cards-2026-11-01'))).toBe(true);
  });

  it('excludes placeholder rows and keeps no-set cards in the published pointer count', async () => {
    const root = makeTempRoot();
    roots.push(root);
    seedPointer(root);

    const result = await runPipeline(root, {
      now: () => new Date('2026-11-01T12:00:00.000Z'),
      fetch: {
        fetchImpl: createMockFetch({ cardDump: placeholderFixture }),
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dropped).toEqual({ unsupported: 0, placeholder: 1 });
    expect(result.pointer.cardCount).toBe(1);

    const pointer = loadPublishedPointer(root);
    expect(pointer?.cardCount).toBe(1);

    const datasetPath = resolveDatasetPath(root, pointer!);
    const datasetText = readFileSync(datasetPath, 'utf8');
    expect(datasetText).toContain('Obelisk the Tormentor');
    expect(datasetText).not.toContain('"???"');
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
      r2: { env: R2_ENV, s3Client: createMockS3() },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('images');

    const pointer = loadPublishedPointer(root);
    expect(pointer?.datasetFile).toBe(prior.datasetFile);
    expect(readdirSync(paths.datasetsDir)).toEqual(beforeDatasets);
  });

  it('skips upstream image fetches when objects already exist in R2', async () => {
    const root = makeTempRoot();
    roots.push(root);
    seedPointer(root);

    const existingKeys = CARD_IDS.flatMap((cardId) => [
      r2LargeObjectKey(cardId),
      r2SmallObjectKey(cardId),
    ]);

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
      r2: { env: R2_ENV, s3Client: createMockS3(existingKeys) },
    });

    expect(result.ok).toBe(true);
    expect(imageFetches).toBe(0);
  });

  it('logs and skips R2 upload when credentials are missing', async () => {
    const root = makeTempRoot();
    roots.push(root);
    seedPointer(root);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runPipeline(root, {
      now: () => new Date('2026-11-01T12:00:00.000Z'),
      fetch: { fetchImpl: createMockFetch() },
      r2: { env: {} },
    });

    expect(result.ok).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(
      'Skipping R2 card image upload: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY is not set.',
    );
    logSpy.mockRestore();
  });
});
