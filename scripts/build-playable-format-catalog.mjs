/**
 * Generates playable format catalog entries and a compact TCG banlist lookup index.
 * Run: node scripts/build-playable-format-catalog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const manifestPath = path.join(repoRoot, 'src/format/data/tcg/manifest.json');
const listsDir = path.join(repoRoot, 'src/format/data/tcg/lists');
const flFormatsPath = path.join(repoRoot, 'src/format/data/formatLibraryFormats.json');
const outFormatsPath = path.join(repoRoot, 'src/format/data/playableFormats.generated.json');
const outLookupPath = path.join(repoRoot, 'src/format/data/tcgBanlistLookup.generated.json');

const CORE_FORMAT_IDS = new Set([
  'advanced',
  'traditional',
  'speed-duel',
  'genesys',
  'goat',
  'hat',
  'tengu',
  'edison',
]);

const ADVANCED_DECK_RULES = 'Main 40–60, Extra 0–15, Side 0–15';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildLookup() {
  const lookup = {};
  const files = fs.readdirSync(listsDir).filter((name) => name.endsWith('.json'));
  for (const file of files) {
    const effectiveDate = file.replace(/\.json$/, '');
    const snapshot = readJson(path.join(listsDir, file));
    const byId = {};
    for (const row of snapshot.cards ?? []) {
      byId[String(row.id)] = row.status;
    }
    lookup[effectiveDate] = byId;
  }
  return lookup;
}

function manifestEntryForDate(manifest, effectiveDate) {
  return manifest.lists.find((entry) => entry.effectiveDate === effectiveDate);
}

function buildFormatEntry({ id, name, banlistEffectiveDate, manifest, usedIds }) {
  if (CORE_FORMAT_IDS.has(id) || usedIds.has(id)) {
    return null;
  }
  const list = manifestEntryForDate(manifest, banlistEffectiveDate);
  if (!list) {
    console.warn(`Skipping ${id}: unknown banlist date ${banlistEffectiveDate}`);
    return null;
  }
  usedIds.add(id);
  const poolCutoff = list.effectiveThrough ?? list.effectiveDate;
  return {
    id,
    name,
    cardSubtitle: `${banlistEffectiveDate} list, pool through ${poolCutoff}`,
    banlistHeading: list.listName,
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'tcg-earliest-on-or-before',
    banlistSource: 'tcg-dated-list',
    banlistEffectiveDate,
    poolCutoffDate: poolCutoff,
    poolCutoffSource: `Cards with earliest TCG set date on or before ${poolCutoff} (Konami list window).`,
    traditionalForbiddenAsLimited: false,
    sortDate: banlistEffectiveDate,
    sortDateSource: list.yugipediaUrl,
  };
}

function buildMetaFormats(manifest, flFormats) {
  const entries = [];
  const usedIds = new Set(CORE_FORMAT_IDS);
  const coveredDates = new Set();

  for (const fl of flFormats) {
    const entry = buildFormatEntry({
      id: fl.id,
      name: fl.name,
      banlistEffectiveDate: fl.banlistEffectiveDate,
      manifest,
      usedIds,
    });
    if (entry) {
      entries.push(entry);
      coveredDates.add(entry.banlistEffectiveDate);
    }
  }

  for (const list of manifest.lists) {
    if (coveredDates.has(list.effectiveDate)) {
      continue;
    }
    const id = `list-${list.effectiveDate}`;
    const entry = buildFormatEntry({
      id,
      name: list.listName.replace(/ TCG Forbidden & Limited List$/i, ''),
      banlistEffectiveDate: list.effectiveDate,
      manifest,
      usedIds,
    });
    if (entry) {
      entries.push(entry);
      coveredDates.add(list.effectiveDate);
    }
  }

  entries.sort((left, right) => right.sortDate.localeCompare(left.sortDate));
  return entries;
}

const manifest = readJson(manifestPath);
const flFormats = readJson(flFormatsPath);
const lookup = buildLookup();
const metaFormats = buildMetaFormats(manifest, flFormats);

fs.writeFileSync(outFormatsPath, `${JSON.stringify(metaFormats, null, 2)}\n`);
fs.writeFileSync(outLookupPath, `${JSON.stringify(lookup)}\n`);

console.log(
  `Wrote ${metaFormats.length} meta formats and ${Object.keys(lookup).length} banlist lookup dates.`,
);
