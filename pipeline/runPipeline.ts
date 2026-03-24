import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { atomicWriteJson } from '../src/shared/fs/atomicWrite.ts';
import {
  validateDatasetEnvelope,
  validateYugiohCard,
  type ValidationIssue,
} from '../src/shared/schema/index.ts';
import {
  DATASETS_SUBDIR,
  DEFAULT_DATA_DIR,
  DEFAULT_POINTER_REL,
  YGOPRODECK_CARDINFO_URL,
} from './constants.ts';
import { fetchCardDump, type FetchCardDumpOptions } from './fetchCardDump.ts';
import { resolveR2PublicBaseUrl } from './imagePaths.ts';
import { uploadCardImagesR2, type UploadCardImagesR2Options } from './uploadLargeCardImagesR2.ts';
import { sha256HexFile } from './hash.ts';
import {
  buildDatasetEnvelope,
  mapYgoprodeckResponse,
  type YgoprodeckDropCounts,
} from './mapYgoprodeck.ts';
import {
  type PublishedPointer,
  resolveDatasetRepoPath,
  siteRelativeDatasetFile,
} from './pointer.ts';

export type PipelinePaths = {
  dataDir: string;
  pointerPath: string;
  datasetsDir: string;
};

export type RunPipelineOptions = {
  paths?: Partial<PipelinePaths>;
  fetch?: FetchCardDumpOptions;
  now?: () => Date;
  r2?: Pick<UploadCardImagesR2Options, 'env' | 's3Client' | 'fetchImpl' | 'concurrency'>;
};

export type RunPipelineResult =
  | {
      ok: true;
      pointer: PublishedPointer;
      datasetPath: string;
      dropped: YgoprodeckDropCounts;
    }
  | {
      ok: false;
      reason: 'fetch' | 'validation' | 'images';
      issues?: ValidationIssue[];
      error?: string;
    };

export function defaultPipelinePaths(repoRoot: string): PipelinePaths {
  const dataDir = join(repoRoot, DEFAULT_DATA_DIR);
  return {
    dataDir,
    pointerPath: join(repoRoot, DEFAULT_POINTER_REL),
    datasetsDir: join(dataDir, DATASETS_SUBDIR),
  };
}

function readExistingPointer(pointerPath: string): PublishedPointer | null {
  if (!existsSync(pointerPath)) return null;
  try {
    return JSON.parse(readFileSync(pointerPath, 'utf8')) as PublishedPointer;
  } catch {
    return null;
  }
}

function datasetFileName(iso: string): string {
  const stamp = iso.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
  return `cards-${stamp}.json`;
}

export async function runPipeline(
  repoRoot: string,
  options: RunPipelineOptions = {},
): Promise<RunPipelineResult> {
  const paths = { ...defaultPipelinePaths(repoRoot), ...options.paths };
  mkdirSync(paths.datasetsDir, { recursive: true });

  let response;
  try {
    response = await fetchCardDump(options.fetch);
  } catch (error) {
    return {
      ok: false,
      reason: 'fetch',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const generatedAt = (options.now?.() ?? new Date()).toISOString();
  const r2Env = options.r2?.env ?? {};
  const publicBaseUrl = resolveR2PublicBaseUrl(r2Env);
  const { cards, dropped } = mapYgoprodeckResponse(response.data, publicBaseUrl);

  const r2Result = await uploadCardImagesR2({
    cardIds: cards.map((card) => card.id),
    variants: ['large', 'small'],
    env: r2Env,
    s3Client: options.r2?.s3Client,
    fetchImpl: options.fetch?.fetchImpl ?? options.r2?.fetchImpl,
    userAgent: options.fetch?.userAgent,
    maxAttempts: options.fetch?.maxAttempts,
    initialBackoffMs: options.fetch?.initialBackoffMs,
    concurrency: options.r2?.concurrency,
  });
  if (r2Result.ok && r2Result.skippedStep) {
    console.log(
      'Skipping R2 card image upload: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY is not set.',
    );
  } else if (!r2Result.ok) {
    return {
      ok: false,
      reason: 'images',
      error: r2Result.error,
    };
  }

  const cardIssues: ValidationIssue[] = [];
  for (let index = 0; index < cards.length; index += 1) {
    const result = validateYugiohCard(cards[index]);
    if (!result.ok) {
      for (const issue of result.errors) {
        cardIssues.push({
          ...issue,
          path: issue.path === '(root)' ? `cards[${index}]` : `cards[${index}].${issue.path}`,
        });
      }
    }
  }

  if (cardIssues.length > 0) {
    return { ok: false, reason: 'validation', issues: cardIssues };
  }

  const envelope = buildDatasetEnvelope(cards, generatedAt);
  const envelopeResult = validateDatasetEnvelope(envelope);
  if (!envelopeResult.ok) {
    return { ok: false, reason: 'validation', issues: envelopeResult.errors };
  }

  const datasetFile = datasetFileName(generatedAt);
  const datasetPath = join(paths.datasetsDir, datasetFile);
  atomicWriteJson(datasetPath, envelope);

  const sha256 = sha256HexFile(datasetPath);
  const datasetRelative = siteRelativeDatasetFile(datasetFile);

  const pointer: PublishedPointer = {
    schemaVersion: envelope.schemaVersion,
    datasetFile: datasetRelative,
    sha256,
    publishedAt: generatedAt,
    cardCount: cards.length,
  };

  atomicWriteJson(paths.pointerPath, pointer);

  return { ok: true, pointer, datasetPath, dropped };
}

export function loadPublishedPointer(repoRoot: string): PublishedPointer | null {
  return readExistingPointer(join(repoRoot, DEFAULT_POINTER_REL));
}

export function resolveDatasetPath(repoRoot: string, pointer: PublishedPointer): string {
  return resolveDatasetRepoPath(repoRoot, pointer.datasetFile);
}

export { resolveDatasetRepoPath } from './pointer.ts';

export { YGOPRODECK_CARDINFO_URL };
