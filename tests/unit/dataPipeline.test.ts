import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { atomicWriteUtf8 } from '../../src/shared/fs/atomicWrite.ts';
import { OTCP_DATASET_SCHEMA_VERSION } from '../../src/shared/schema/constants.ts';
import type { PublishedPointer } from '../../pipeline/pointer.ts';
import {
  defaultPipelinePaths,
  loadPublishedPointer,
  resolveDatasetPath,
  runPipeline,
} from '../../pipeline/runPipeline.ts';
import validFixture from '../fixtures/pipeline/ygoprodeck-valid-two.json';
import invalidFixture from '../fixtures/pipeline/ygoprodeck-invalid-name.json';

function makeTempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'otcp-pipeline-'));
}

function seedPointer(root: string, cardCount = 1): PublishedPointer {
  const paths = defaultPipelinePaths(root);
  const priorDatasetRel = 'public/data/datasets/cards-prior.json';
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
        images: { small: '/otcp/card-images/1.jpg', large: '/otcp/card-images/1.jpg' },
        sets: [],
      },
    ],
  };
  const datasetPath = join(root, priorDatasetRel);
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
      fetch: {
        fetchImpl: async () =>
          new Response(JSON.stringify(validFixture), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const pointer = loadPublishedPointer(root);
    expect(pointer?.datasetFile).not.toBe(prior.datasetFile);
    expect(pointer?.cardCount).toBe(2);
    expect(pointer?.sha256).toMatch(/^[a-f0-9]{64}$/);

    const datasetPath = resolveDatasetPath(root, pointer!);
    expect(readFileSync(datasetPath, 'utf8')).toContain('Dark Magician');
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
        fetchImpl: async () =>
          new Response(JSON.stringify(invalidFixture), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
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
});
