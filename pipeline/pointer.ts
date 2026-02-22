import { join } from 'node:path';

import { DATASETS_SUBDIR } from './constants.ts';
import { OTCP_DATASET_SCHEMA_VERSION } from '../src/shared/schema/constants.ts';

export type PublishedPointer = {
  schemaVersion: typeof OTCP_DATASET_SCHEMA_VERSION;
  datasetFile: string;
  sha256: string;
  publishedAt: string;
  cardCount: number;
};

/** Path under the published site root (no `public/` prefix). */
export function siteRelativeDatasetFile(datasetBasename: string): string {
  return `data/${DATASETS_SUBDIR}/${datasetBasename}`.replaceAll('\\', '/');
}

/** Map a pointer `datasetFile` to a repo path under `public/`. */
export function datasetFileToRepoRelative(datasetFile: string): string {
  const normalized = datasetFile.replaceAll('\\', '/');
  if (normalized.startsWith('public/')) {
    return normalized;
  }
  if (normalized.startsWith('data/')) {
    return join('public', normalized).replaceAll('\\', '/');
  }
  throw new Error(`Unrecognized datasetFile path: ${datasetFile}`);
}

export function resolveDatasetRepoPath(repoRoot: string, datasetFile: string): string {
  return join(repoRoot, datasetFileToRepoRelative(datasetFile));
}

export function pointerBasename(datasetFile: string): string {
  const parts = datasetFile.split('/');
  return parts[parts.length - 1] ?? datasetFile;
}
