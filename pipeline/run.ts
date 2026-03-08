#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { logYgoprodeckDropCounts } from './logDropCounts.ts';
import { runPipeline } from './runPipeline.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const result = await runPipeline(repoRoot);

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
  console.log(
    `Published ${result.pointer.cardCount} cards → ${result.pointer.datasetFile} (sha256 ${result.pointer.sha256})`,
  );
}
