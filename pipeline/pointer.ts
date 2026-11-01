import { OTCP_DATASET_SCHEMA_VERSION } from '../src/shared/schema/constants.ts';

export type PublishedPointer = {
  schemaVersion: typeof OTCP_DATASET_SCHEMA_VERSION;
  datasetFile: string;
  sha256: string;
  publishedAt: string;
  cardCount: number;
};

export function pointerBasename(datasetFile: string): string {
  const parts = datasetFile.split('/');
  return parts[parts.length - 1] ?? datasetFile;
}
