import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  allowlistFromIds,
  annotateRows,
  checkLock,
  classifyLicense,
  compareInstalled,
  isDenied,
  loadAllowlist,
  packagesFromLock,
  parseArgs,
  toCsv,
} from './scan-licenses.mjs';

const allow = new Set([
  'MIT',
  'Apache-2.0',
  'ISC',
  'BSD-2-Clause',
  '0BSD',
  'MPL-2.0',
  'CC-BY-4.0',
  'BlueOak-1.0.0',
]);

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

test('denied families stay denied even if listed', () => {
  assert.equal(isDenied('GPL-3.0-only'), true);
  assert.equal(isDenied('GPL-2.0+'), true);
  assert.equal(isDenied('LGPL-2.1-or-later'), true);
  assert.equal(isDenied('AGPL-3.0-only'), true);
  assert.equal(isDenied('SSPL-1.0'), true);
  assert.equal(isDenied('MPL-2.0'), false);
  assert.throws(() => allowlistFromIds(['MIT', 'GPL-3.0-only']), /Allowlist cannot include/);
  const poisoned = new Set(['MIT', 'GPL-3.0-only']);
  const result = classifyLicense('GPL-3.0-only', poisoned);
  assert.equal(result.ok, false);
  assert.equal(result.nonPermissive, true);
});

test('expressions elect a permissive side and fail closed otherwise', () => {
  const cases = [
    ['MIT', { ok: true, nonPermissive: false, notice: true }],
    ['0BSD', { ok: true, nonPermissive: false, notice: false }],
    ['MPL-2.0', { ok: true, notice: true }],
    ['CC-BY-4.0', { ok: true, notice: true }],
    ['BlueOak-1.0.0', { ok: true, notice: true }],
    ['Apache-2.0 WITH LLVM-exception', { ok: true, notice: true }],
    ['MIT OR GPL-3.0-only', { ok: true, nonPermissive: false, notice: true }],
    ['(MIT OR Apache-2.0) AND ISC', { ok: true, notice: true }],
    ['GPL-2.0-only OR AGPL-3.0-only', { ok: false, nonPermissive: true, denied: true }],
    ['MIT AND GPL-3.0-only', { ok: false, nonPermissive: true, denied: true }],
    ['LGPL-3.0-or-later', { ok: false, nonPermissive: true }],
    ['Artistic-2.0', { ok: false, nonPermissive: false, unlisted: true }],
    ['Artistic-2.0 OR GPL-3.0-only', { ok: false, nonPermissive: false, unlisted: true }],
    ['', { ok: false, nonPermissive: true, unknown: true }],
    ['UNLICENSED', { ok: false, nonPermissive: true, unknown: true }],
    ['SEE LICENSE IN LICENSE', { ok: false, nonPermissive: true, unknown: true }],
    ['MIT OR', { ok: false, nonPermissive: true, unknown: true }],
  ];
  for (const [license, expected] of cases) {
    const result = classifyLicense(license, allow);
    for (const [key, value] of Object.entries(expected)) {
      assert.equal(result[key], value, `${license || '(empty)'} ${key}`);
    }
  }
  assert.equal(classifyLicense({ type: 'MIT' }, allow).ok, true);
  assert.equal(classifyLicense(['MIT', 'Apache-2.0'], allow).license, 'MIT OR Apache-2.0');
});

test('lockfile rows mark direct, dev, runtime, and optional packages', () => {
  const lock = {
    packages: {
      '': { dependencies: { react: '^19.0.0' }, devDependencies: { vitest: '^5.0.0' } },
      'node_modules/react': { version: '19.3.1', license: 'MIT' },
      'node_modules/scheduler': { version: '0.28.0', license: 'MIT' },
      'node_modules/vitest': { version: '5.0.5', license: 'MIT', dev: true },
      'node_modules/fsevents': { version: '2.3.3', license: 'MIT', dev: true, optional: true },
      'node_modules/react/node_modules/loose-envify': { version: '1.4.0', license: 'MIT' },
    },
  };
  const rows = annotateRows(packagesFromLock(lock, 'fixture'), allow);
  assert.deepEqual(
    rows.map((row) => [
      row.name,
      row.relationship,
      row.scope,
      row.optional,
      row.noticesAttribution,
    ]),
    [
      ['fsevents', 'transitive', 'dev', true, false],
      ['react', 'direct', 'runtime', false, true],
      ['scheduler', 'transitive', 'runtime', false, true],
      ['vitest', 'direct', 'dev', false, false],
    ],
  );
  const csv = toCsv(rows);
  assert.match(csv.split('\n')[0], /^source,name,version,license,/);
  assert.equal(toCsv([{ ...rows[0], license: 'MIT, extra' }]).includes('"MIT, extra"'), true);
});

test('parseArgs pairs each lockfile with a source name', () => {
  const options = parseArgs([
    '--lock',
    'a.json',
    '--source',
    'main',
    '--lock',
    'b.json',
    '--source',
    'scaffold-draft',
    '--csv',
    'out.csv',
  ]);
  assert.equal(options.check, false);
  assert.equal(options.csv, 'out.csv');
  assert.deepEqual(options.locks, [
    { file: 'a.json', source: 'main' },
    { file: 'b.json', source: 'scaffold-draft' },
  ]);
});

test('compareInstalled flags a package.json license that differs from the lockfile', () => {
  const root = mkdtempSync(join(tmpdir(), 's04-'));
  try {
    mkdirSync(join(root, 'node_modules', 'left'), { recursive: true });
    mkdirSync(join(root, 'node_modules', 'same'), { recursive: true });
    writeFileSync(
      join(root, 'node_modules', 'left', 'package.json'),
      JSON.stringify({ license: 'ISC' }),
    );
    writeFileSync(
      join(root, 'node_modules', 'same', 'package.json'),
      JSON.stringify({ license: { type: 'MIT' } }),
    );
    const lock = {
      packages: {
        '': {},
        'node_modules/left': { version: '1.0.0', license: 'MIT', dev: true },
        'node_modules/same': { version: '1.2.0', license: 'MIT', dev: true },
        'node_modules/missing': { version: '2.0.0', license: 'MIT', dev: true, optional: true },
      },
    };
    const report = compareInstalled(lock, root);
    assert.equal(report.checked, 1);
    assert.equal(report.skipped, 1);
    assert.equal(report.mismatches.length, 1);
    assert.equal(report.mismatches[0].name, 'left');
    assert.equal(report.mismatches[0].diskLicense, 'ISC');
    const result = checkLock(lock, allow, root);
    assert.equal(result.ok, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the repo allowlist accepts the main lockfile', () => {
  const projectAllow = loadAllowlist();
  for (const id of [
    'MIT',
    'Apache-2.0',
    'ISC',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'BlueOak-1.0.0',
    'MPL-2.0',
    'CC-BY-4.0',
    '0BSD',
  ]) {
    assert.equal(projectAllow.has(id), true, id);
  }
  const lock = JSON.parse(readFileSync(join(repoRoot, 'package-lock.json'), 'utf8'));
  const result = checkLock(lock, projectAllow, null);
  assert.equal(result.ok, true);
  assert.equal(result.rows.length, 327);
  assert.equal(result.rows.filter((row) => row.scope === 'runtime').length, 7);
  const mpl = result.rows.filter((row) => row.license === 'MPL-2.0');
  assert.equal(mpl.length, 12);
  assert.ok(mpl.every((row) => row.scope === 'dev' && row.name.startsWith('lightningcss')));
  const vite = result.rows.find((row) => row.name === 'vite');
  assert.equal(vite.version, '7.3.7');
  assert.equal(vite.relationship, 'direct');
  assert.equal(vite.scope, 'dev');
  assert.equal(vite.license, 'MIT');
});

test('installed package.json licenses match the main lockfile', () => {
  const installed = join(repoRoot, 'node_modules', 'typescript', 'package.json');
  try {
    readFileSync(installed);
  } catch {
    return;
  }
  const lock = JSON.parse(readFileSync(join(repoRoot, 'package-lock.json'), 'utf8'));
  const report = compareInstalled(lock, repoRoot);
  const lockRows = packagesFromLock(lock, 'installed');
  assert.deepEqual(report.mismatches, []);
  assert.equal(report.checked + report.skipped, lockRows.length);
  assert.ok(report.checked > 0, 'expected at least one installed package to cross-check');
});
