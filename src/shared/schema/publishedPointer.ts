import { OTCP_DATASET_SCHEMA_VERSION, OTCP_DATASET_SCHEMA_VERSION_LEGACY } from './constants.ts';

/** Site-root segment for versioned dataset artifacts (`data/datasets/…`). */
export const OTCP_DATASETS_SUBDIR = 'datasets';

export type PublishedPointerLegacy = {
  schemaVersion: typeof OTCP_DATASET_SCHEMA_VERSION_LEGACY;
  datasetFile: string;
  sha256: string;
  publishedAt: string;
  cardCount: number;
};

export type PublishedPointerSplit = {
  schemaVersion: typeof OTCP_DATASET_SCHEMA_VERSION;
  searchIndexFile: string;
  searchIndexSha256: string;
  detailsPrefix: string;
  detailsBucketSize: number;
  detailBucketCount: number;
  publishedAt: string;
  cardCount: number;
};

export type PublishedPointer = PublishedPointerLegacy | PublishedPointerSplit;

export function isPublishedPointerLegacy(value: PublishedPointer): value is PublishedPointerLegacy {
  return value.schemaVersion === OTCP_DATASET_SCHEMA_VERSION_LEGACY;
}

export function isPublishedPointerSplit(value: PublishedPointer): value is PublishedPointerSplit {
  return value.schemaVersion === OTCP_DATASET_SCHEMA_VERSION;
}

/** Path under the published site root (no `public/` prefix). */
export function siteRelativeDatasetFile(datasetBasename: string): string {
  return `data/${OTCP_DATASETS_SUBDIR}/${datasetBasename}`.replaceAll('\\', '/');
}
