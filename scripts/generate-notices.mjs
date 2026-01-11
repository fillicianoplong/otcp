// Build src/data/notices.json from package.json and the lockfile (direct runtime deps only).

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { normalizeLicense, packagesFromLock } from '../spikes/s04/scan-licenses.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function npmPackageLink(name) {
  return `https://www.npmjs.com/package/${encodeURIComponent(name)}`;
}

export function buildNoticesData(repoRootPath) {
  const pkg = JSON.parse(readFileSync(join(repoRootPath, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(join(repoRootPath, 'package-lock.json'), 'utf8'));
  const directRuntime = packagesFromLock(lock, 'main').filter(
    (row) => row.relationship === 'direct' && row.scope === 'runtime',
  );
  const declared = Object.keys(pkg.dependencies ?? {}).sort();
  const byName = new Map(directRuntime.map((row) => [row.name, row]));

  for (const name of declared) {
    if (!byName.has(name)) {
      throw new Error(`Lockfile is missing direct runtime package: ${name}`);
    }
  }

  const dependencies = declared.map((name) => {
    const row = byName.get(name);
    return {
      name: row.name,
      version: row.version,
      license: normalizeLicense(row.license),
      link: npmPackageLink(row.name),
    };
  });

  return { dependencies };
}

export function writeNoticesJson(repoRootPath, data = buildNoticesData(repoRootPath)) {
  const outPath = join(repoRootPath, 'src/data/notices.json');
  writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`);
  return outPath;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const outPath = writeNoticesJson(repoRoot);
    console.log(`Wrote ${outPath}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
