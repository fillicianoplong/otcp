import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const distAssets = join(process.cwd(), 'dist', 'assets');
const forbidden = ['service_role', 'sb_secret_'];

let files;
try {
  files = readdirSync(distAssets).filter((name) => name.endsWith('.js'));
} catch {
  console.error('Missing dist/assets — run npm run build before check:client-secrets');
  process.exit(1);
}

const hits = [];
for (const file of files) {
  const text = readFileSync(join(distAssets, file), 'utf8');
  for (const needle of forbidden) {
    if (text.includes(needle)) {
      hits.push({ file, needle });
    }
  }
}

if (hits.length > 0) {
  console.error('Client bundle must not contain secrets:');
  for (const { file, needle } of hits) {
    console.error(`  ${file}: found "${needle}"`);
  }
  process.exit(1);
}

console.log('Client bundle secret check passed.');
