import { join } from 'node:path';

export type {
  PublishedPointer,
  PublishedPointerLegacy,
  PublishedPointerSplit,
} from '../src/shared/schema/publishedPointer.ts';
export {
  isPublishedPointerLegacy,
  isPublishedPointerSplit,
  siteRelativeDatasetFile,
} from '../src/shared/schema/publishedPointer.ts';

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

export function publishedDataFileToRepoRelative(relativePath: string): string {
  return datasetFileToRepoRelative(relativePath);
}

export function resolveDatasetRepoPath(repoRoot: string, datasetFile: string): string {
  return join(repoRoot, datasetFileToRepoRelative(datasetFile));
}

export function resolvePublishedDataRepoPath(repoRoot: string, relativePath: string): string {
  return resolveDatasetRepoPath(repoRoot, relativePath);
}

export function pointerBasename(datasetFile: string): string {
  const parts = datasetFile.split('/');
  return parts[parts.length - 1] ?? datasetFile;
}
