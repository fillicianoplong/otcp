import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { findSecretHitsInBundle } from './clientBundleSecretScan.mjs';

const distAssets = join(process.cwd(), 'dist', 'assets');

const hits = findSecretHitsInBundle(
  distAssets,
  (dir) => readdirSync(dir),
  (path, encoding) => readFileSync(path, encoding),
);

if (hits === null) {
  console.error('Missing dist/assets — run npm run build before check:client-secrets');
  process.exit(1);
}

if (hits.length > 0) {
  console.error('Client bundle must not contain secrets:');
  for (const { file, kind, detail } of hits) {
    console.error(`  ${file}: ${kind} (${detail})`);
  }
  process.exit(1);
}

console.log('Client bundle secret check passed.');
