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
export type FormatId = 'advanced' | 'traditional';

export type FormatPoolRule = 'full-tcg';

export type FormatBanlistSource = 'tcg-current';

const ADVANCED_DECK_RULES = 'Main 40–60 · Extra 0–15 · Side 0–15';

const KONAMI_TCG_CURRENT_LIST_URL = 'https://www.yugioh-card.com/en/limited/list_2026-02-02/';

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
