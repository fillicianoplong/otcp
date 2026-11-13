export const SEARCH_SCROLL_STATE_KEY = 'otcpSearchScroll';

export type SearchScrollRestore = {
  loadedCount: number;
  scrollY: number;
  query: string;
  /** Serialized filter state signature; empty string when no filters. */
  filtersKey?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

export function parseSearchScrollRestore(
  state: unknown,
  query: string,
  filtersKey = '',
): SearchScrollRestore | null {
  if (!isRecord(state)) return null;
  const raw = state[SEARCH_SCROLL_STATE_KEY];
  if (!isRecord(raw)) return null;
  const loadedCount = raw.loadedCount;
  const scrollY = raw.scrollY;
  const savedQuery = raw.query;
  const savedFiltersKey = typeof raw.filtersKey === 'string' ? raw.filtersKey : '';
  if (typeof loadedCount !== 'number' || !Number.isFinite(loadedCount) || loadedCount < 0) {
    return null;
  }
  if (typeof scrollY !== 'number' || !Number.isFinite(scrollY) || scrollY < 0) {
    return null;
  }
  if (typeof savedQuery !== 'string' || savedQuery !== query) return null;
  if (savedFiltersKey !== filtersKey) return null;
  return { loadedCount, scrollY, query: savedQuery, filtersKey: savedFiltersKey };
}

export function mergeSearchScrollRestore(
  state: unknown,
  restore: SearchScrollRestore,
): Record<string, unknown> {
  const base = isRecord(state) ? { ...state } : {};
  base[SEARCH_SCROLL_STATE_KEY] = restore;
  return base;
}

export function withoutSearchScrollRestore(state: unknown): Record<string, unknown> | null {
  if (!isRecord(state) || !(SEARCH_SCROLL_STATE_KEY in state))
    return isRecord(state) ? state : null;
  const next = { ...state };
  delete next[SEARCH_SCROLL_STATE_KEY];
  return next;
}
