// Classify licenses in an npm lockfile (v2 or v3) against license-allowlist.json.
// GPL, AGPL, LGPL, and SSPL fail even if they are added to that file.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DENIED_FAMILIES = new Set(['GPL', 'AGPL', 'LGPL', 'SSPL']);
const UNKNOWN_IDS = new Set(['UNLICENSED', 'UNKNOWN', 'NOASSERTION', 'NONE', 'NO-LICENSE']);
const NO_NOTICE = new Set(['0BSD', 'CC0-1.0', 'Unlicense', 'MIT-0']);
const KEYWORDS = new Set(['OR', 'AND', 'WITH']);

const CSV_COLUMNS = [
  'source',
  'name',
  'version',
  'license',
  'relationship',
  'scope',
  'optional',
  'allowlist',
  'non_permissive',
  'notices_attribution',
];

export function normalizeLicense(license) {
  if (license == null) return '';
  if (typeof license === 'string') return license.trim();
  if (Array.isArray(license)) {
    return license
      .map((item) => normalizeLicense(item))
      .filter((item) => item !== '')
      .join(' OR ');
  }
  if (typeof license === 'object' && typeof license.type === 'string') {
    return license.type.trim();
  }
  return String(license).trim();
}

export function licenseFamily(id) {
  const head = id.split('-')[0] ?? '';
  return head.replace(/\+$/, '').toUpperCase();
}

export function isDenied(id) {
  return DENIED_FAMILIES.has(licenseFamily(id));
}

function isUnknown(id) {
  const upper = id.toUpperCase();
  return UNKNOWN_IDS.has(upper) || upper.startsWith('LICENSEREF-');
}

export function allowlistFromIds(ids) {
  const allow = new Set(ids);
  for (const id of allow) {
    if (isDenied(id)) {
      throw new Error(`Allowlist cannot include ${id}`);
    }
  }
  return allow;
}

export function loadAllowlist(file = new URL('./license-allowlist.json', import.meta.url)) {
  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(parsed.spdx)) {
    throw new Error('Allowlist is missing an spdx array');
  }
  return allowlistFromIds(parsed.spdx);
}

function tokenize(input) {
  const tokens = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (char === ' ' || char === '\t' || char === '\n') {
      index += 1;
      continue;
    }
    if (char === '(' || char === ')') {
      tokens.push(char);
      index += 1;
      continue;
    }
    let end = index;
    while (end < input.length && !' \t\n()'.includes(input[end])) {
      end += 1;
    }
    tokens.push(input.slice(index, end));
    index = end;
  }
  return tokens;
}

function parseExpression(input) {
  const tokens = tokenize(input);
  if (tokens.length === 0) throw new Error('empty license');
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function eat(value) {
    if (tokens[index] !== value) throw new Error(`expected ${value}`);
    index += 1;
  }

  function parseOr() {
    const parts = [parseAnd()];
    while (peek() === 'OR') {
      eat('OR');
      parts.push(parseAnd());
    }
    return parts.length === 1 ? parts[0] : { kind: 'or', parts };
  }

  function parseAnd() {
    const parts = [parseUnary()];
    while (peek() === 'AND') {
      eat('AND');
      parts.push(parseUnary());
    }
    return parts.length === 1 ? parts[0] : { kind: 'and', parts };
  }

  function parseUnary() {
    if (peek() === '(') {
      eat('(');
      const node = parseOr();
      eat(')');
      return node;
    }
    const id = peek();
    if (!id || KEYWORDS.has(id) || id === ')') throw new Error('expected license id');
    index += 1;
    if (peek() === 'WITH') {
      eat('WITH');
      const exception = peek();
      if (!exception || KEYWORDS.has(exception) || exception === ')') {
        throw new Error('expected license exception');
      }
      index += 1;
      return { kind: 'with', id, exception };
    }
    return { kind: 'id', id };
  }

  const node = parseOr();
  if (index !== tokens.length) throw new Error('trailing license tokens');
  return node;
}

function evalId(id, allow) {
  if (isDenied(id)) {
    return {
      ok: false,
      nonPermissive: true,
      denied: true,
      unknown: false,
      unlisted: false,
      elected: [],
    };
  }
  if (isUnknown(id)) {
    return {
      ok: false,
      nonPermissive: true,
      denied: false,
      unknown: true,
      unlisted: false,
      elected: [],
    };
  }
  if (!allow.has(id)) {
    return {
      ok: false,
      nonPermissive: false,
      denied: false,
      unknown: false,
      unlisted: true,
      elected: [],
    };
  }
  return {
    ok: true,
    nonPermissive: false,
    denied: false,
    unknown: false,
    unlisted: false,
    elected: [id],
  };
}

function evaluate(node, allow) {
  if (node.kind === 'id' || node.kind === 'with') return evalId(node.id, allow);
  const parts = node.parts.map((part) => evaluate(part, allow));
  if (node.kind === 'or') {
    const chosen = parts.find((part) => part.ok);
    if (chosen) {
      return {
        ok: true,
        nonPermissive: false,
        denied: false,
        unknown: false,
        unlisted: false,
        elected: chosen.elected,
      };
    }
    const nonPermissive = parts.every((part) => part.nonPermissive);
    return {
      ok: false,
      nonPermissive,
      denied: nonPermissive && parts.some((part) => part.denied),
      unknown: nonPermissive && parts.some((part) => part.unknown),
      unlisted: parts.some((part) => part.unlisted),
      elected: [],
    };
  }
  const ok = parts.every((part) => part.ok);
  return {
    ok,
    nonPermissive: parts.some((part) => part.nonPermissive),
    denied: parts.some((part) => part.denied),
    unknown: parts.some((part) => part.unknown),
    unlisted: parts.some((part) => part.unlisted),
    elected: ok ? parts.flatMap((part) => part.elected) : [],
  };
}

function failedLicense(license) {
  return {
    license,
    ok: false,
    nonPermissive: true,
    denied: false,
    unknown: true,
    unlisted: false,
    notice: false,
    elected: [],
  };
}

export function classifyLicense(license, allow) {
  const normalized = normalizeLicense(license);
  if (normalized === '' || /^see license\b/i.test(normalized) || /^unlicensed$/i.test(normalized)) {
    return failedLicense(normalized);
  }
  try {
    const evaluated = evaluate(parseExpression(normalized), allow);
    const notice = evaluated.ok && evaluated.elected.some((id) => !NO_NOTICE.has(id));
    return { license: normalized, ...evaluated, notice };
  } catch {
    return failedLicense(normalized);
  }
}

function packageName(pkgPath, meta) {
  if (typeof meta.name === 'string' && meta.name !== '') return meta.name;
  const marker = 'node_modules/';
  return pkgPath.slice(pkgPath.lastIndexOf(marker) + marker.length);
}

export function packagesFromLock(lock, source) {
  const packages = lock.packages ?? {};
  const root = packages[''] ?? {};
  const direct = new Set([
    ...Object.keys(root.dependencies ?? {}),
    ...Object.keys(root.devDependencies ?? {}),
  ]);
  const rows = [];
  for (const [pkgPath, meta] of Object.entries(packages)) {
    if (pkgPath === '' || pkgPath.split('node_modules/').length > 2) continue;
    const name = packageName(pkgPath, meta);
    rows.push({
      source,
      name,
      version: meta.version ?? '',
      license: normalizeLicense(meta.license),
      relationship: direct.has(name) ? 'direct' : 'transitive',
      scope: meta.dev ? 'dev' : 'runtime',
      optional: Boolean(meta.optional),
    });
  }
  rows.sort(
    (left, right) =>
      left.name.localeCompare(right.name) ||
      left.version.localeCompare(right.version, undefined, { numeric: true }),
  );
  return rows;
}

export function annotateRows(rows, allow) {
  return rows.map((row) => {
    const classified = classifyLicense(row.license, allow);
    return {
      ...row,
      license: classified.license,
      allowlist: classified.ok,
      nonPermissive: classified.nonPermissive,
      noticesAttribution: row.scope === 'runtime' && classified.notice,
    };
  });
}

function yesNo(value) {
  return value ? 'yes' : 'no';
}

function csvField(value) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function toCsv(rows) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const row of rows) {
    const record = {
      source: row.source,
      name: row.name,
      version: row.version,
      license: row.license,
      relationship: row.relationship,
      scope: row.scope,
      optional: yesNo(row.optional),
      allowlist: yesNo(row.allowlist),
      non_permissive: yesNo(row.nonPermissive),
      notices_attribution: yesNo(row.noticesAttribution),
    };
    lines.push(CSV_COLUMNS.map((column) => csvField(record[column])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function compareInstalled(lock, modulesRoot) {
  const report = { checked: 0, skipped: 0, mismatches: [] };
  for (const row of packagesFromLock(lock, 'installed')) {
    const pkgJsonPath = join(modulesRoot, 'node_modules', row.name, 'package.json');
    if (!existsSync(pkgJsonPath)) {
      report.skipped += 1;
      continue;
    }
    const diskLicense = normalizeLicense(JSON.parse(readFileSync(pkgJsonPath, 'utf8')).license);
    if (diskLicense !== row.license) {
      report.mismatches.push({
        name: row.name,
        version: row.version,
        lockLicense: row.license,
        diskLicense,
      });
      continue;
    }
    report.checked += 1;
  }
  return report;
}

export function checkLock(lock, allow, modulesRoot) {
  const rows = annotateRows(packagesFromLock(lock, 'main'), allow);
  const problems = [];
  for (const row of rows) {
    if (row.nonPermissive) {
      if (row.optional && row.scope === 'dev') continue;
      problems.push({ kind: 'non-permissive', row });
    } else if (!row.allowlist) problems.push({ kind: 'not-allowed', row });
  }
  const disk = modulesRoot
    ? compareInstalled(lock, modulesRoot)
    : { checked: 0, skipped: 0, mismatches: [] };
  for (const mismatch of disk.mismatches) problems.push({ kind: 'mismatch', mismatch });
  return { rows, disk, problems, ok: problems.length === 0 };
}

function readLock(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function printCheck(result, modulesRoot) {
  const nonPermissive = result.problems.filter((problem) => problem.kind === 'non-permissive');
  const unlisted = result.problems.filter((problem) => problem.kind === 'not-allowed');
  console.log(
    `License check: ${result.rows.length} packages, ${nonPermissive.length} non-permissive, ${unlisted.length} outside the allowlist.`,
  );
  if (modulesRoot) {
    console.log(
      `package.json cross-check: ${result.disk.checked} matched, ${result.disk.skipped} not installed.`,
    );
  } else {
    console.log('package.json cross-check skipped (node_modules is not installed).');
  }
  for (const problem of nonPermissive) {
    const row = problem.row;
    console.log(
      `non-permissive: ${row.name}@${row.version} ${row.license} ${row.relationship} ${row.scope}`,
    );
  }
  for (const problem of unlisted) {
    const row = problem.row;
    console.log(
      `not allowed: ${row.name}@${row.version} ${row.license} ${row.relationship} ${row.scope}`,
    );
  }
  for (const problem of result.problems) {
    if (problem.kind !== 'mismatch') continue;
    const item = problem.mismatch;
    console.log(
      `mismatch: ${item.name}@${item.version} lock=${item.lockLicense} package.json=${item.diskLicense}`,
    );
  }
  const weakRuntime = result.rows.filter(
    (row) => row.scope === 'runtime' && (row.license === 'MPL-2.0' || row.license === 'CC-BY-4.0'),
  );
  for (const row of weakRuntime) {
    console.log(`runtime notice: ${row.name}@${row.version} ${row.license}`);
  }
}

export function parseArgs(argv) {
  const options = { check: false, csv: '', locks: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') {
      options.check = true;
      continue;
    }
    if (arg === '--csv') {
      index += 1;
      if (!argv[index]) throw new Error('--csv needs a path');
      options.csv = argv[index];
      continue;
    }
    if (arg === '--lock') {
      index += 1;
      const file = argv[index];
      if (!file) throw new Error('--lock needs a path');
      let source = 'main';
      if (argv[index + 1] === '--source') {
        source = argv[index + 2];
        if (!source) throw new Error('--source needs a name');
        index += 2;
      }
      options.locks.push({ file, source });
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.check && options.csv === '') options.check = true;
  if (options.locks.length === 0) options.locks.push({ file: 'package-lock.json', source: 'main' });
  return options;
}

export function run(argv, cwd = process.cwd()) {
  const options = parseArgs(argv);
  const allow = loadAllowlist();
  if (options.csv !== '') {
    const rows = [];
    for (const item of options.locks) {
      rows.push(...annotateRows(packagesFromLock(readLock(item.file), item.source), allow));
    }
    writeFileSync(options.csv, toCsv(rows));
    console.log(`Wrote ${rows.length} rows to ${options.csv}`);
  }
  if (options.check) {
    const modulesRoot = existsSync(join(cwd, 'node_modules')) ? cwd : null;
    const result = checkLock(readLock(join(cwd, 'package-lock.json')), allow, modulesRoot);
    printCheck(result, modulesRoot);
    if (!result.ok) process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
