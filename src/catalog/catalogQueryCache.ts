import type { CatalogTableSortState } from './catalogTableSort.ts';
import { sortCatalogTableRows } from './catalogTableSort.ts';
import type { CatalogDerived } from './catalogDerived.ts';
import {
  emptyFilterState,
  type FacetGroupCounts,
  type FilterApplyOptions,
  type FilterState,
} from './filterEngine.ts';
import { filterStateSignature } from './filterUrlState.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

export type CatalogQueryInput = {
  filterState?: FilterState;
  query?: string;
  tableSort?: CatalogTableSortState;
  formatParam?: string | null;
};

export type CatalogQueryResult = {
  matchCount: number;
  visibleCards: YugiohCard[];
  facetGroupCounts: FacetGroupCounts[];
  ids: readonly number[];
};

type FilterCacheEntry = {
  ids: readonly number[];
  matchCount: number;
  visibleCards: YugiohCard[];
  facetGroupCounts: FacetGroupCounts[];
  tableSorted: Map<string, YugiohCard[]>;
};

const MAX_FILTER_CACHE_ENTRIES = 12;

const filterCacheByCatalog = new WeakMap<readonly YugiohCard[], Map<string, FilterCacheEntry>>();

function normalizeQuery(query: string | undefined): string {
  return (query ?? '').trim();
}

function filterCacheKey(query: string, filterSig: string): string {
  return `${query}\u0000${filterSig}`;
}

function tableSortCacheKey(
  sort: CatalogTableSortState,
  formatParam: string | null | undefined,
): string {
  return `${sort.column}:${sort.direction}:${formatParam ?? ''}`;
}

function touchFilterCache(
  catalog: readonly YugiohCard[],
  key: string,
  entry: FilterCacheEntry,
): FilterCacheEntry {
  let map = filterCacheByCatalog.get(catalog);
  if (!map) {
    map = new Map();
    filterCacheByCatalog.set(catalog, map);
  }
  if (map.has(key)) map.delete(key);
  map.set(key, entry);
  while (map.size > MAX_FILTER_CACHE_ENTRIES) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
  return entry;
}

function visibleCardsFromIds(
  ids: readonly number[],
  cardById: ReadonlyMap<number, YugiohCard>,
): YugiohCard[] {
  const out = new Array<YugiohCard>(ids.length);
  for (let i = 0; i < ids.length; i++) {
    const card = cardById.get(ids[i]!);
    if (card) out[i] = card;
  }
  return out;
}

function buildFilterEntry(
  derived: CatalogDerived,
  filterState: FilterState,
  query: string,
): FilterCacheEntry {
  const filterSig = filterStateSignature(filterState);
  const cacheKey = filterCacheKey(query, filterSig);
  const existingMap = filterCacheByCatalog.get(derived.cards);
  const hit = existingMap?.get(cacheKey);
  if (hit) {
    touchFilterCache(derived.cards, cacheKey, hit);
    return hit;
  }

  let searchIds: readonly number[] | undefined;
  if (query.length > 0) {
    searchIds = derived.searchIndex.query(query).ids;
  }
  const applyOptions: FilterApplyOptions = searchIds ? { searchIds } : {};
  const applied = derived.filterEngine.apply(filterState, applyOptions);
  const facetGroupCounts = derived.filterEngine.recount(filterState, applyOptions);
  const visibleCards = visibleCardsFromIds(applied.ids, derived.cardById);

  const entry: FilterCacheEntry = {
    ids: applied.ids,
    matchCount: applied.count,
    visibleCards,
    facetGroupCounts,
    tableSorted: new Map(),
  };
  return touchFilterCache(derived.cards, cacheKey, entry);
}

export function queryCatalog(
  derived: CatalogDerived,
  input: CatalogQueryInput = {},
): CatalogQueryResult {
  const filterState = input.filterState ?? emptyFilterState();
  const query = normalizeQuery(input.query);
  const filterEntry = buildFilterEntry(derived, filterState, query);

  if (!input.tableSort) {
    return {
      matchCount: filterEntry.matchCount,
      visibleCards: filterEntry.visibleCards,
      facetGroupCounts: filterEntry.facetGroupCounts,
      ids: filterEntry.ids,
    };
  }

  const sortKey = tableSortCacheKey(input.tableSort, input.formatParam);
  let sorted = filterEntry.tableSorted.get(sortKey);
  if (!sorted) {
    sorted = sortCatalogTableRows(filterEntry.visibleCards, input.tableSort, input.formatParam);
    filterEntry.tableSorted.set(sortKey, sorted);
  }

  return {
    matchCount: filterEntry.matchCount,
    visibleCards: sorted,
    facetGroupCounts: filterEntry.facetGroupCounts,
    ids: filterEntry.ids,
  };
}

export function forgetCatalogQueryCache(cards: readonly YugiohCard[]): void {
  filterCacheByCatalog.delete(cards);
}
