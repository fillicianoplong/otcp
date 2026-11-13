import type { FormatDefinition } from './formatCatalog.ts';
import { formatDetailPath } from './formatCatalog.ts';
import {
  getFormatBanlistSnapshot,
  isBanlistSnapshotFormatId,
  type BanlistSnapshotFormatId,
} from './banlistSnapshots.ts';
import { DEFAULT_GENESYS_POINT_CAP } from './formatEngine/genesysRules.ts';
import { getGenesysKonamiPointsDocument } from './genesysKonamiPoints.ts';

const KONAMI_SPEED_DUEL_GUIDE_URL =
  'https://img.yugioh-card.com/en/downloads/rulebook/Speed_Duel_Guide_EN.pdf';

const KONAMI_SPEED_DUEL_FNL_PAGE_URL =
  'https://www.yugioh-card.com/eu/play/speed-duel-forbidden-limited-list/';

const SPEED_DUEL_DETAIL_INTRO =
  'Konami launched Speed Duel for the physical TCG in January 2019 with Speed Duel Starter Decks: Destiny Masters and Duelists of Tomorrow (North America launch 25 January 2019), adapting the faster Yu-Gi-Oh! Duel Links style of play for tabletop Duels.';

export type FormatSourceLink = {
  readonly label: string;
  readonly href: string;
};

export type FormatDetailBanList = {
  readonly effectiveDate?: string;
  readonly listName: string;
  readonly historyPath?: string;
};

export type FormatDetailCardPool = {
  readonly cardsReleasedBy: string;
  /** Visible latest-set line. */
  readonly latestSet: string;
  /** Set name for the Search filter. Null when the line is not one set. */
  readonly latestSetQuery: string | null;
  readonly notIncluded?: string;
  /** Set name for the Search filter. Null when the line is not one set. */
  readonly notIncludedQuery: string | null;
};

export type FormatDetailFacts = {
  readonly description: string | null;
  readonly banList: FormatDetailBanList | null;
  readonly cardPool: FormatDetailCardPool | null;
  readonly genesysDetail: FormatDetailGenesysFacts | null;
  readonly sourceLinks: readonly FormatSourceLink[];
};

export type FormatDetailGenesysFacts = {
  readonly banListName: string;
  readonly pointCap: number;
  readonly notIncluded: string;
};

/** Catalog exclusion notes use an "Excludes …" prefix; the grid shows the set name only. */
export function poolNotIncludedFromExclusionNote(
  exclusionNote: string | undefined,
): string | undefined {
  if (!exclusionNote) return undefined;
  const trimmed = exclusionNote.trim();
  const withoutPrefix = trimmed.replace(/^Excludes\s+/i, '');
  return withoutPrefix.length > 0 ? withoutPrefix : undefined;
}

function linkFromSortDateSource(sortDateSource: string | undefined): FormatSourceLink | null {
  if (!sortDateSource) return null;
  const match = /\((https:\/\/[^)]+)\)\s*$/.exec(sortDateSource);
  if (!match) return null;
  return { label: 'Konami TCG Forbidden & Limited List', href: match[1] };
}

function snapshotSourceLinks(formatId: BanlistSnapshotFormatId): FormatSourceLink[] {
  const snapshot = getFormatBanlistSnapshot(formatId);
  return [
    { label: snapshot.source.name, href: snapshot.source.url },
    { label: 'Ban list reference', href: snapshot.snapshotSourceUrl },
  ];
}

function mergeSourceLinks(
  base: readonly FormatSourceLink[],
  extra: readonly FormatSourceLink[] | undefined,
): FormatSourceLink[] {
  const seen = new Set<string>();
  const merged: FormatSourceLink[] = [];
  for (const link of [...base, ...(extra ?? [])]) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    merged.push(link);
  }
  return merged;
}

const BAN_LIST_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const BAN_LIST_MONTH_PATTERN = BAN_LIST_MONTHS.join('|');

function titleCaseMonth(month: string): string {
  return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
}

function monthYearFromIso(iso: string | undefined): string | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (!match) return null;
  const month = BAN_LIST_MONTHS[Number(match[2]) - 1];
  if (!month) return null;
  return `${month} ${match[1]}`;
}

/**
 * "April 2005 TCG Forbidden/Limited List" → "April 2005 TCG".
 * Undated names use the effective date and a region (TCG, Speed Duel, or Genesys).
 */
export function shortBanListLabel(listName: string, effectiveDate?: string): string {
  const dated = listName.match(
    new RegExp(
      `^(${BAN_LIST_MONTH_PATTERN})\\s+(\\d{4})(?:\\s+(TCG|OCG))?(?:\\s+Lists(?:\\s+\\((TCG|OCG)\\))?)?`,
      'i',
    ),
  );
  if (dated) {
    const region = (dated[3] ?? dated[4] ?? 'TCG').toUpperCase();
    return `${titleCaseMonth(dated[1]!)} ${dated[2]} ${region}`;
  }

  const fromDate = monthYearFromIso(effectiveDate);
  if (/speed duel/i.test(listName)) {
    return fromDate ? `${fromDate} Speed Duel` : 'Speed Duel';
  }
  if (/genesys/i.test(listName)) {
    return fromDate ? `${fromDate} Genesys` : 'Genesys';
  }
  if (fromDate) return `${fromDate} TCG`;

  return listName
    .replace(/\s+Forbidden\s*[/&]\s*Limited List$/i, '')
    .replace(/\s+point list$/i, '')
    .trim();
}

function shortenLatestSet(setName: string): { display: string; query: string | null } {
  if (setName === 'All TCG sets through the list window') {
    return { display: 'All TCG sets', query: null };
  }
  if (setName.startsWith('Speed Duel: ')) {
    return { display: setName.slice('Speed Duel: '.length), query: setName };
  }
  return { display: setName, query: setName };
}

function shortenNotIncluded(note: string): { display: string; query: string | null } {
  if (note === 'Printings without the Speed Duel symbol on the card') {
    return { display: 'No Speed Duel symbol', query: null };
  }
  if (note === 'Link and Pendulum Monsters') {
    return { display: 'Link, Pendulum', query: null };
  }
  return { display: note, query: note };
}

function historyPathForFormat(format: FormatDefinition): string {
  return formatDetailPath(format.id);
}

function buildBanList(format: FormatDefinition): FormatDetailBanList | null {
  if (format.banlistSource === 'genesys-points') {
    return null;
  }

  if (format.banlistSource === 'tcg-dated-list') {
    const effectiveDate = format.banlistEffectiveDate ?? format.sortDate;
    if (!effectiveDate) return null;
    return {
      effectiveDate,
      listName: shortBanListLabel(format.banlistHeading, effectiveDate),
      historyPath: formatDetailPath(format.id),
    };
  }

  const effectiveDate = format.sortDate;
  if (!effectiveDate) return null;

  const historyPath = historyPathForFormat(format);

  if (format.banlistSource === 'curated-snapshot' && isBanlistSnapshotFormatId(format.id)) {
    const snapshot = getFormatBanlistSnapshot(format.id);
    return {
      effectiveDate: snapshot.effectiveDate,
      listName: shortBanListLabel(snapshot.listName, snapshot.effectiveDate),
      historyPath,
    };
  }

  return {
    effectiveDate,
    listName: shortBanListLabel(format.banlistHeading, effectiveDate),
    historyPath,
  };
}

function buildCardPool(format: FormatDefinition): FormatDetailCardPool | null {
  if (format.poolRule === 'speed-duel-ygoprodeck') {
    return null;
  }
  if (format.poolRule !== 'tcg-earliest-on-or-before') return null;
  if (!format.poolCutoffDate) return null;

  const exclusion = poolNotIncludedFromExclusionNote(format.poolExclusionNote);
  const notIncluded = exclusion ? shortenNotIncluded(exclusion) : null;
  const latest = shortenLatestSet(format.poolThroughSet ?? 'All TCG sets through the list window');

  return {
    cardsReleasedBy: format.poolCutoffDate,
    latestSet: latest.display,
    latestSetQuery: latest.query,
    notIncluded: notIncluded?.display,
    notIncludedQuery: notIncluded?.query ?? null,
  };
}

function buildSpeedDuelDetailFacts(): FormatDetailFacts {
  return {
    description: SPEED_DUEL_DETAIL_INTRO,
    banList: {
      listName: shortBanListLabel('Speed Duel Forbidden & Limited List', '2026-07-10'),
    },
    cardPool: {
      cardsReleasedBy: '2024-12-13',
      latestSet: 'Battle City Finals',
      latestSetQuery: 'Speed Duel: Battle City Finals',
      notIncluded: 'No Speed Duel symbol',
      notIncludedQuery: null,
    },
    genesysDetail: null,
    sourceLinks: [
      {
        label: 'Speed Duel Forbidden & Limited List',
        href: KONAMI_SPEED_DUEL_FNL_PAGE_URL,
      },
      {
        label: 'Konami Speed Duel Guide (PDF)',
        href: KONAMI_SPEED_DUEL_GUIDE_URL,
      },
    ],
  };
}

/** Built from catalog entries and curated snapshot JSON only. */
export function buildFormatDetailFacts(format: FormatDefinition): FormatDetailFacts {
  if (format.id === 'speed-duel') {
    return buildSpeedDuelDetailFacts();
  }

  const description = format.description?.trim() ? format.description.trim() : null;

  if (format.banlistSource === 'genesys-points') {
    const konami = getGenesysKonamiPointsDocument();
    return {
      description,
      banList: null,
      cardPool: null,
      genesysDetail: {
        banListName: shortBanListLabel(format.banlistHeading, format.sortDate),
        pointCap: konami.standardPointCap ?? DEFAULT_GENESYS_POINT_CAP,
        notIncluded: 'Link, Pendulum',
      },
      sourceLinks: mergeSourceLinks([], format.detailSourceLinks),
    };
  }

  let sourceLinks: FormatSourceLink[] = [];
  if (format.banlistSource === 'curated-snapshot' && isBanlistSnapshotFormatId(format.id)) {
    sourceLinks = snapshotSourceLinks(format.id);
  } else {
    const tcgLink = linkFromSortDateSource(format.sortDateSource);
    if (tcgLink) {
      sourceLinks = [tcgLink];
    }
  }

  sourceLinks = mergeSourceLinks(sourceLinks, format.detailSourceLinks);

  return {
    description,
    banList: buildBanList(format),
    cardPool: buildCardPool(format),
    genesysDetail: null,
    sourceLinks,
  };
}
