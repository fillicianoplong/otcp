#!/usr/bin/env node
/**
 * Builds dated TCG Forbidden & Limited snapshots from Yugipedia Limitation list templates.
 * Run once when refreshing history data: node scripts/build-tcg-banlist-snapshots.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/format/data/tcg');
const LISTS_DIR = path.join(OUT_DIR, 'lists');

const YUGIPEDIA_API = 'https://yugipedia.com/api.php';
const CATEGORY = 'Category:TCG Advanced Format Forbidden & Limited Lists';
const YGO_CARDINFO = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const FORMAT_LIBRARY_BANLISTS = 'https://formatlibrary.com/banlists';
const RETRIEVED = '2026-11-04';

const MONTHS = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** @param {string} raw e.g. "May 7, 2002" */
function parseHumanDate(raw) {
  const trimmed = raw.trim().replace(/\.$/, '');
  const m = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(trimmed);
  if (!m) throw new Error(`Unparseable date: ${raw}`);
  const month = MONTHS[m[1].toLowerCase()];
  if (month === undefined) throw new Error(`Unknown month in: ${raw}`);
  const day = Number(m[2]);
  const year = Number(m[3]);
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

async function yugipedia(params) {
  const url = new URL(YUGIPEDIA_API);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OTCP-banlist-builder/1.0 (fillicianoplong/otcp; research)' },
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`Yugipedia HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('Yugipedia rate limited after retries');
}

async function listCategoryPages() {
  const pages = [];
  let continueToken;
  do {
    const data = await yugipedia({
      action: 'query',
      format: 'json',
      list: 'categorymembers',
      cmtitle: CATEGORY,
      cmlimit: '500',
      ...(continueToken ? { cmcontinue: continueToken } : {}),
    });
    for (const member of data.query.categorymembers) {
      pages.push(member.title);
    }
    continueToken = data.continue?.cmcontinue;
  } while (continueToken);
  return pages;
}

async function fetchWikitext(pageTitle) {
  const data = await yugipedia({
    action: 'parse',
    format: 'json',
    page: pageTitle,
    prop: 'wikitext',
  });
  return data.parse.wikitext['*'];
}

function extractLimitationTemplate(wikitext) {
  const marker = '{{Limitation list';
  const start = wikitext.indexOf(marker);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < wikitext.length - 1; i += 1) {
    if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
      depth += 1;
      i += 1;
    } else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
      depth -= 1;
      i += 1;
      if (depth === 0) {
        return wikitext.slice(start, i + 1);
      }
    }
  }
  return null;
}

function parseTemplateBlock(wikitext) {
  const block = extractLimitationTemplate(wikitext);
  if (!block) return null;
  const fields = {};
  const lines = block.split('\n').slice(1, -1);
  let currentKey = null;
  let buffer = [];
  for (const line of lines) {
    const inline = /^\|\s*([^=|]+?)\s*=\s*(.*)$/.exec(line);
    if (inline) {
      if (currentKey) fields[currentKey] = buffer.join('\n').trim();
      currentKey = inline[1].trim();
      const rest = inline[2].trim();
      buffer = rest ? [rest] : [];
      continue;
    }
    if (currentKey) buffer.push(line);
  }
  if (currentKey) fields[currentKey] = buffer.join('\n').trim();
  return fields;
}

function parseCardLines(sectionText) {
  if (!sectionText) return [];
  return sectionText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\s*\/\/\s*prev::.*$/i, '').trim())
    .map((line) => line.replace(/\s*\/\/\s*force-smw.*$/i, '').trim())
    .map((line) => line.replace(/\s*\/\/\s*unreleased::.*$/i, '').trim())
    .filter(Boolean);
}

function normalizeName(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').replace(/[’']/g, "'").trim();
}

const MANUAL_NAME_ALIASES = new Map([[normalizeName('Morphing Jar 2'), 'Morphing Jar #2']]);

function yugipediaNameToLookup(name) {
  return name.replace(/\bMaliss ([A-Z])\b/g, 'Maliss <$1>');
}

async function loadYgoNameIndex() {
  const res = await fetch(YGO_CARDINFO);
  if (!res.ok) throw new Error(`YGOPRODeck HTTP ${res.status}`);
  const json = await res.json();
  /** @type {Map<string, { id: number, passcode: string, name: string }>} */
  const byNorm = new Map();
  for (const card of json.data) {
    const names = [card.name, ...(card.misc_names ?? [])];
    for (const name of names) {
      const norm = normalizeName(name);
      if (!byNorm.has(norm)) {
        byNorm.set(norm, {
          id: card.id,
          passcode: String(card.passcode ?? card.id),
          name: card.name,
        });
      }
    }
  }
  return byNorm;
}

function matchCard(name, byNorm) {
  const candidates = [name, yugipediaNameToLookup(name)];
  const alias = MANUAL_NAME_ALIASES.get(normalizeName(name));
  if (alias) candidates.push(alias);
  for (const candidate of candidates) {
    const hit = byNorm.get(normalizeName(candidate));
    if (hit) return hit;
  }
  return undefined;
}

function buildListName(pageTitle) {
  let base = pageTitle.replace(/\s*\(TCG\)\s*$/i, '').trim();
  base = base.replace(/\sLists\s*$/i, '').trim();
  return `${base} TCG Forbidden & Limited List`;
}

function compactCardRow(card) {
  const row = { id: card.id, name: card.name, status: card.status };
  if (card.note && card.note.trim()) row.note = card.note;
  const passcodeNum = Number(card.passcode);
  if (Number.isFinite(passcodeNum) && passcodeNum !== card.id) {
    row.passcode = card.passcode;
  }
  if (card.uncertain) row.uncertain = true;
  return row;
}

async function main() {
  console.log('Loading YGOPRODeck name index…');
  const byNorm = await loadYgoNameIndex();

  console.log('Listing Yugipedia category…');
  const pageTitles = await listCategoryPages();
  console.log(`Found ${pageTitles.length} list pages`);

  /** @type {Array<{ pageTitle: string, effectiveDate: string, effectiveThrough?: string, listName: string, fields: Record<string,string> }>} */
  const parsed = [];

  for (const pageTitle of pageTitles) {
    await new Promise((r) => setTimeout(r, 350));
    const wikitext = await fetchWikitext(pageTitle);
    const fields = parseTemplateBlock(wikitext);
    if (!fields?.start_date) {
      console.warn(`Skip (no template): ${pageTitle}`);
      continue;
    }
    const effectiveDate = parseHumanDate(fields.start_date);
    const effectiveThrough = fields.end_date ? parseHumanDate(fields.end_date) : undefined;
    parsed.push({
      pageTitle,
      effectiveDate,
      effectiveThrough,
      listName: buildListName(pageTitle),
      fields,
    });
  }

  parsed.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));

  /** @type {Array<{ effectiveDate: string, name: string, status: string, pageTitle: string }>} */
  const globalGaps = [];

  await mkdir(LISTS_DIR, { recursive: true });

  const manifest = {
    retrieved: RETRIEVED,
    lineage: 'TCG Advanced Format Forbidden & Limited Lists',
    sources: [
      {
        name: 'Yugipedia',
        url: 'https://yugipedia.com/wiki/Category:TCG_Advanced_Format_Forbidden_%26_Limited_Lists',
        statement: 'Limitation list templates transcribed per list page.',
      },
      {
        name: 'Format Library',
        url: FORMAT_LIBRARY_BANLISTS,
        statement: 'Cross-check for list dates and UX reference only (ADR-004).',
      },
    ],
    lists: [],
    gaps: [],
  };

  for (let i = 0; i < parsed.length; i += 1) {
    const entry = parsed[i];
    const gaps = [];
    const cards = [];

    for (const status of ['forbidden', 'limited', 'semi_limited']) {
      const statusKey = status === 'semi_limited' ? 'semi_limited' : status;
      const fileStatus = status === 'semi_limited' ? 'semi-limited' : status;
      const names = parseCardLines(entry.fields[statusKey]);
      for (const name of names) {
        const match = matchCard(name, byNorm);
        if (!match) {
          gaps.push({ name, status: fileStatus, pageTitle: entry.pageTitle });
          globalGaps.push({
            effectiveDate: entry.effectiveDate,
            name,
            status: fileStatus,
            pageTitle: entry.pageTitle,
          });
          continue;
        }
        cards.push({
          id: match.id,
          passcode: match.passcode,
          name: match.name,
          status: fileStatus,
          note: name !== match.name ? `Yugipedia name: ${name}` : '',
        });
      }
    }

    cards.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const yugipediaUrl = `https://yugipedia.com/wiki/${encodeURIComponent(entry.pageTitle.replace(/ /g, '_'))}`;

    const snapshot = {
      listName: entry.listName,
      effectiveDate: entry.effectiveDate,
      ...(entry.effectiveThrough ? { effectiveThrough: entry.effectiveThrough } : {}),
      sortDate: entry.effectiveDate,
      retrieved: RETRIEVED,
      snapshotSourceUrl: yugipediaUrl,
      source: {
        name: 'Yugipedia',
        url: yugipediaUrl,
        statement: `Transcribed from the ${entry.pageTitle} Limitation list template.`,
      },
      listWindowSource: {
        name: 'Format Library banlists',
        url: FORMAT_LIBRARY_BANLISTS,
        note: 'Date ranges cross-checked against Format Library headings where available.',
      },
      cards: cards.map(compactCardRow),
      ...(gaps.length > 0 ? { gaps } : {}),
    };

    const outPath = path.join(LISTS_DIR, `${entry.effectiveDate}.json`);
    await writeFile(outPath, `${JSON.stringify(snapshot)}\n`);

    manifest.lists.push({
      effectiveDate: entry.effectiveDate,
      effectiveThrough: entry.effectiveThrough,
      listName: entry.listName,
      pageTitle: entry.pageTitle,
      yugipediaUrl,
      counts: {
        forbidden: cards.filter((c) => c.status === 'forbidden').length,
        limited: cards.filter((c) => c.status === 'limited').length,
        'semi-limited': cards.filter((c) => c.status === 'semi-limited').length,
      },
      gapCount: gaps.length,
    });
  }

  manifest.gaps = globalGaps;

  await writeFile(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest)}\n`);

  console.log(`Wrote ${manifest.lists.length} snapshots to ${LISTS_DIR}`);
  console.log(`Unmatched names (gaps): ${globalGaps.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
