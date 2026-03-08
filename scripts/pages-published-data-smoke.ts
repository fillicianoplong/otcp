#!/usr/bin/env node
import { runPagesPublishedDataSmoke } from './pagesPublishedDataSmoke.ts';

async function main(): Promise<void> {
  await runPagesPublishedDataSmoke({
    baseUrl: process.env.BASE_URL ?? '',
    expectedDatasetFile: process.env.EXPECTED_DATASET_FILE,
    publishedArtifactPublicDir: process.env.PUBLISHED_ARTIFACT_PUBLIC_DIR,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
