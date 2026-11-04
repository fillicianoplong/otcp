/** ISO 8601 calendar date (YYYY-MM-DD) for newest-first sort and UI labels. */
export type FormatSortDate = string;

export type FormatDefinition = {
  readonly id: FormatId;
  readonly name: string;
  /** Short line under the title on the Formats grid. */
  readonly cardSubtitle: string;
  /** Shown after "Banlist ·" on the format detail page. */
  readonly banlistHeading: string;
  readonly deckRulesSummary: string;
  readonly poolRule: FormatPoolRule;
  readonly banlistSource: FormatBanlistSource;
  /** Required when `poolRule` is `tcg-earliest-on-or-before`. */
  readonly poolCutoffDate?: FormatSortDate;
  readonly poolCutoffSource?: string;
  /** When true, Advanced-Forbidden cards display and behave as Limited (FR-15). */
  readonly traditionalForbiddenAsLimited: boolean;
  /**
   * Newest-first sort key and muted date beside the name when set.
   * Maintainer updates when the format's banlist snapshot changes.
   */
  readonly sortDate?: FormatSortDate;
  /** Where `sortDate` was taken from (documented in PRs; not shown in UI). */
  readonly sortDateSource?: string;
};

/** Must-format ids shipped in v1; extend this union as M4 issues land (#34–#38). */
export type FormatId = 'advanced' | 'traditional' | 'hat' | 'tengu' | 'goat';

export type FormatPoolRule = 'full-tcg' | 'tcg-earliest-on-or-before';

export type FormatBanlistSource = 'tcg-current' | 'curated-snapshot';

const ADVANCED_DECK_RULES = 'Main 40–60 · Extra 0–15 · Side 0–15';

const KONAMI_TCG_CURRENT_LIST_URL = 'https://www.yugioh-card.com/en/limited/list_2026-02-02/';

const GOAT_SNAPSHOT_URL = 'https://www.goatformat.com/cardpool.html';
const HAT_LIST_ARCHIVE_URL =
  'https://web.archive.org/web/20140825020840/http://www.yugioh-card.com/en/limited/Apr_2014.html';
const TENGU_LIST_ARCHIVE_URL =
  'https://web.archive.org/web/20120226021414/http://www.yugioh-card.com/en/limited/11_09_list.html';

export const FORMAT_CATALOG: readonly FormatDefinition[] = [
  {
    id: 'advanced',
    name: 'Advanced',
    cardSubtitle: 'TCG Advanced · current',
    banlistHeading: 'current TCG Forbidden & Limited List',
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'full-tcg',
    banlistSource: 'tcg-current',
    traditionalForbiddenAsLimited: false,
    sortDate: '2026-02-02',
    sortDateSource: `Konami TCG Forbidden & Limited List, effective 2026-02-02 (${KONAMI_TCG_CURRENT_LIST_URL})`,
  },
  {
    id: 'traditional',
    name: 'Traditional',
    cardSubtitle: 'Allows Forbidden at 1',
    banlistHeading: 'Forbidden treated as Limited',
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'full-tcg',
    banlistSource: 'tcg-current',
    traditionalForbiddenAsLimited: true,
    sortDate: '2026-02-02',
    sortDateSource: `Same TCG Forbidden & Limited List as Advanced, effective 2026-02-02 (${KONAMI_TCG_CURRENT_LIST_URL})`,
  },
  {
    id: 'hat',
    name: 'HAT',
    cardSubtitle: 'April 2014 list · July 2014 pool',
    banlistHeading: 'April 2014 TCG Forbidden & Limited List',
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'tcg-earliest-on-or-before',
    poolCutoffDate: '2014-07-11',
    poolCutoffSource:
      'July 11, 2014 NAWCQ pool per hatformat.com/about.html; see docs/formats-sources.md for alternate cutoffs.',
    banlistSource: 'curated-snapshot',
    traditionalForbiddenAsLimited: false,
    sortDate: '2014-04-01',
    sortDateSource: `Archived Konami list effective 2014-04-01 (${HAT_LIST_ARCHIVE_URL})`,
  },
  {
    id: 'tengu',
    name: 'Tengu Plant',
    cardSubtitle: 'September 2011 list · Generation Force pool',
    banlistHeading: 'September 2011 TCG Forbidden & Limited List',
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'tcg-earliest-on-or-before',
    poolCutoffDate: '2011-08-16',
    poolCutoffSource:
      'Generation Force (2011-08-16) as latest set per tenguformat.com and YGOPRODeck set dates.',
    banlistSource: 'curated-snapshot',
    traditionalForbiddenAsLimited: false,
    sortDate: '2011-09-01',
    sortDateSource: `Archived Konami list effective 2011-09-01 (${TENGU_LIST_ARCHIVE_URL})`,
  },
  {
    id: 'goat',
    name: 'GOAT',
    cardSubtitle: 'April 2005 list · pool through Aug 2005',
    banlistHeading: 'April 2005 TCG Forbidden & Limited List',
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'tcg-earliest-on-or-before',
    poolCutoffDate: '2005-08-31',
    poolCutoffSource:
      'Sets through Dark Beginning 2 on GoatFormat.com; end of August 2005 cutoff excludes Cybernetic Revolution.',
    banlistSource: 'curated-snapshot',
    traditionalForbiddenAsLimited: false,
    sortDate: '2005-04-01',
    sortDateSource: `April 2005 TCG list per GoatFormat.com (${GOAT_SNAPSHOT_URL})`,
  },
] as const;

const formatById = new Map<string, FormatDefinition>(
  FORMAT_CATALOG.map((format) => [format.id, format]),
);

const catalogOrder = new Map(FORMAT_CATALOG.map((format, index) => [format.id, index]));

export function listFormats(): readonly FormatDefinition[] {
  return FORMAT_CATALOG;
}

/** Newest `sortDate` first; ties keep catalog order; undated formats sort last. */
export function listFormatsNewestFirst(): readonly FormatDefinition[] {
  return [...FORMAT_CATALOG].sort((left, right) => {
    const leftDate = left.sortDate ?? '';
    const rightDate = right.sortDate ?? '';
    if (leftDate !== rightDate) {
      if (!leftDate) return 1;
      if (!rightDate) return -1;
      return rightDate.localeCompare(leftDate);
    }
    return (catalogOrder.get(left.id) ?? 0) - (catalogOrder.get(right.id) ?? 0);
  });
}

export function getFormatById(id: string | null | undefined): FormatDefinition | undefined {
  if (typeof id !== 'string') return undefined;
  return formatById.get(id.trim().toLowerCase());
}

/** Returns a catalog format id when the param is recognized; otherwise null. */
export function normalizeFormatId(param: string | null | undefined): FormatId | null {
  const format = getFormatById(param);
  return format?.id ?? null;
}

export function isKnownFormatId(param: string | null | undefined): boolean {
  return normalizeFormatId(param) !== null;
}

export function formatDisplayName(formatId: FormatId): string {
  return getFormatById(formatId)?.name ?? formatId;
}

export function formatDetailPath(formatId: FormatId): string {
  return `/formats/${formatId}`;
}

export function searchWithFormatPath(formatId: FormatId): string {
  return `/search?format=${encodeURIComponent(formatId)}`;
}
