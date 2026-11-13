#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { logYgoprodeckDropCounts } from './logDropCounts.ts';
import { isPublishedPointerLegacy, isPublishedPointerSplit } from './pointer.ts';
import { runPipeline } from './runPipeline.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const result = await runPipeline(repoRoot, {
  r2: { env: process.env },
});

if (!result.ok) {
  if (result.reason === 'fetch') {
    console.error(`DataPipeline fetch failed: ${result.error ?? 'unknown error'}`);
  } else if (result.reason === 'images') {
    console.error(`DataPipeline image step failed: ${result.error ?? 'unknown error'}`);
  } else {
    console.error('DataPipeline validation failed:');
    for (const issue of result.issues ?? []) {
      console.error(`  ${issue.path}: ${issue.message}`);
    }
  }
  process.exitCode = 1;
} else {
  logYgoprodeckDropCounts(result.dropped);
  const catalogFile = isPublishedPointerSplit(result.pointer)
    ? result.pointer.searchIndexFile
    : isPublishedPointerLegacy(result.pointer)
      ? result.pointer.datasetFile
      : 'unknown';
  const digest = isPublishedPointerSplit(result.pointer)
    ? result.pointer.searchIndexSha256
    : isPublishedPointerLegacy(result.pointer)
      ? result.pointer.sha256
      : 'unknown';
  console.log(`Published ${result.pointer.cardCount} cards → ${catalogFile} (sha256 ${digest})`);
}
