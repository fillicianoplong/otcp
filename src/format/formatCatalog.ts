/** ISO 8601 calendar date (YYYY-MM-DD) for newest-first sort and UI labels. */
export type FormatSortDate = string;

export type FormatDetailSourceLink = {
  readonly label: string;
  readonly href: string;
};

export type FormatDefinition = {
  readonly id: FormatId;
  readonly name: string;
  /** Historical intro on the format detail page; omit when empty. */
  readonly description?: string;
  /** Extra Sources row links (merged with snapshot defaults for curated formats). */
  readonly detailSourceLinks?: readonly FormatDetailSourceLink[];
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
  /** Last set included in a historical pool (Card pool detail row). */
  readonly poolThroughSet?: string;
  /** Muted exclusion line under Card pool on the format detail page. */
  readonly poolExclusionNote?: string;
  /** When true, Advanced-Forbidden cards display and behave as Limited (FR-15). */
  readonly traditionalForbiddenAsLimited: boolean;
  /**
   * Newest-first sort key (maintainer updates when the format's banlist snapshot changes).
   */
  readonly sortDate?: FormatSortDate;
  /** Where `sortDate` was taken from (documented in PRs; not shown in UI). */
  readonly sortDateSource?: string;
};

/** Must-format ids shipped in v1; extend this union as M4 issues land (#34–#38). */
export type FormatId = 'advanced' | 'traditional' | 'hat' | 'tengu' | 'edison' | 'goat';

export type FormatPoolRule = 'full-tcg' | 'tcg-earliest-on-or-before';

export type FormatBanlistSource = 'tcg-current' | 'curated-snapshot';

const ADVANCED_DECK_RULES = 'Main 40–60, Extra 0–15, Side 0–15';

const KONAMI_TCG_CURRENT_LIST_URL = 'https://www.yugioh-card.com/en/limited/list_2026-02-02/';

const GOAT_SNAPSHOT_URL = 'https://www.goatformat.com/cardpool.html';
const FORMAT_LIBRARY_GOAT_URL = 'https://formatlibrary.com/formats/goat';
const YUGIPEDIA_GOAT_CONTROL_URL = 'https://yugipedia.com/wiki/Goat_Control';
const FORMAT_LIBRARY_HAT_URL = 'https://formatlibrary.com/formats/hat';
const HAT_ABOUT_URL = 'https://www.hatformat.com/about.html';
const FORMAT_LIBRARY_TENGU_URL = 'https://formatlibrary.com/formats/tengu';
const FORMAT_LIBRARY_EDISON_URL = 'https://formatlibrary.com/formats/edison';
const HAT_LIST_ARCHIVE_URL =
  'https://web.archive.org/web/20140825020840/http://www.yugioh-card.com/en/limited/Apr_2014.html';
const TENGU_LIST_ARCHIVE_URL =
  'https://web.archive.org/web/20120226021414/http://www.yugioh-card.com/en/limited/11_09_list.html';
const EDISON_LIST_YUGIPEDIA_URL = 'https://yugipedia.com/wiki/March_2010_Lists_(TCG)';
const EDISON_RULES_URL = 'https://edisonformat.net/rules/banlist';

export const FORMAT_CATALOG: readonly FormatDefinition[] = [
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Current TCG Advanced format using the live Konami Forbidden & Limited List.',
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
    description: 'Advanced rules with Forbidden cards limited to one copy each.',
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
    description:
      'HAT covers the competitive summer of 2014 that peaked at the North American World Championship Qualifier, when Hand, Artifact, and Traptrix packs defined the top end alongside Mermail, Bujin, and Spellbook strategies. The format name follows Korey McDuffie’s H.A.T. list that won that NAWCQ. Players still treat it as the last snapshot before Pendulum Monsters and the end of the first-turn draw, with active support from HATFormat.com.',
    detailSourceLinks: [
      { label: 'About', href: HAT_ABOUT_URL },
      { label: 'Format Library', href: FORMAT_LIBRARY_HAT_URL },
    ],
    cardSubtitle: 'April 2014 list · July 2014 pool',
    banlistHeading: 'April 2014 TCG Forbidden & Limited List',
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'tcg-earliest-on-or-before',
    poolCutoffDate: '2014-07-11',
    poolThroughSet: 'Primal Origin',
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
    description:
      'Tengu Plant revisits the metagame from YCS Toronto, when Reborn Tengu and Plant tuners toolboxed into Synchro bosses such as Trishula, Dragon of the Ice Barrier. Agents, Elemental HERO, T.G., and Chaos lists shared the top tables then and still see play online. The wide pool, first-wave XYZ tools, and Konami Time Wizard support make it a common choice for rogue brews and big events.',
    detailSourceLinks: [{ label: 'Format Library', href: FORMAT_LIBRARY_TENGU_URL }],
    cardSubtitle: 'September 2011 list · Generation Force pool',
    banlistHeading: 'September 2011 TCG Forbidden & Limited List',
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'tcg-earliest-on-or-before',
    poolCutoffDate: '2011-08-16',
    poolThroughSet: 'Generation Force',
    poolCutoffSource:
      'Generation Force (2011-08-16) as latest set per tenguformat.com and YGOPRODeck set dates.',
    banlistSource: 'curated-snapshot',
    traditionalForbiddenAsLimited: false,
    sortDate: '2011-09-01',
    sortDateSource: `Archived Konami list effective 2011-09-01 (${TENGU_LIST_ARCHIVE_URL})`,
  },
  {
    id: 'edison',
    name: 'Edison',
    description:
      'Edison is named for the Shonen Jump Championship in New Jersey where Jeff Jones’s Quickdraw Plant list took the title. Elemental HERO, Lightsworn, and Plant Synchro engines fought Blackwing and Machina strategies in one of the TCG’s most open deck-building windows. Community tours and a stable banlist keep it among the most played retro formats online.',
    detailSourceLinks: [{ label: 'Format Library', href: FORMAT_LIBRARY_EDISON_URL }],
    cardSubtitle: 'March 2010 list · Duelist Pack: Kaiba pool',
    banlistHeading: 'March 2010 TCG Forbidden & Limited List',
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'tcg-earliest-on-or-before',
    poolCutoffDate: '2010-04-16',
    poolThroughSet: 'Duelist Pack: Kaiba',
    poolExclusionNote: 'Excludes Duelist Revolution',
    poolCutoffSource:
      'Duelist Pack: Kaiba (2010-04-16) per edisonformat.net and YGOPRODeck set dates; see docs/formats-sources.md.',
    banlistSource: 'curated-snapshot',
    traditionalForbiddenAsLimited: false,
    sortDate: '2010-03-01',
    sortDateSource: `March 2010 TCG list (${EDISON_LIST_YUGIPEDIA_URL}); pool rule (${EDISON_RULES_URL})`,
  },
  {
    id: 'goat',
    name: 'GOAT',
    description:
      'Goat snapshots the Yu-Gi-Oh! TCG as it was played at premier events in mid-2005. Goat Control—built around Scapegoat and Metamorphosis into Thousand-Eyes Restrict—was the signature deck of the time, though today’s community metagame leans heavily on Chaos Turbo lists. Organizers still run GoatFormat.com leagues, PWCQs, and world events because the small pool rewards careful reads and resource management.',
    detailSourceLinks: [
      { label: 'Format Library', href: FORMAT_LIBRARY_GOAT_URL },
      { label: 'Goat Control', href: YUGIPEDIA_GOAT_CONTROL_URL },
    ],
    cardSubtitle: 'April 2005 list · pool through Aug 2005',
    banlistHeading: 'April 2005 TCG Forbidden & Limited List',
    deckRulesSummary: ADVANCED_DECK_RULES,
    poolRule: 'tcg-earliest-on-or-before',
    poolCutoffDate: '2005-08-31',
    poolThroughSet: 'Dark Beginning 2',
    poolExclusionNote: 'Excludes Cybernetic Revolution',
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
