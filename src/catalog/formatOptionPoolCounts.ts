import { getFormatById, listFormats, type FormatId } from '../format/formatCatalog.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import type { CatalogDerived } from './catalogDerived.ts';
import { queryCatalog } from './catalogQueryCache.ts';
import type { FilterState } from './filterEngine.ts';
import { filterCatalogIdsByFormatPool } from './formatPoolQuery.ts';

export type FormatOptionPoolCounts = Readonly<Partial<Record<FormatId, number>>>;

/** Sidebar counts are omitted when the format catalog is too large for per-format queries. */
export const MAX_FORMATS_WITH_POOL_OPTION_COUNTS = 24;

function filterStateHasBanStatusSelection(filterState: FilterState): boolean {
  const ban = filterState.facets.banStatus;
  return (ban?.include?.length ?? 0) > 0 || (ban?.exclude?.length ?? 0) > 0;
}

function countForFormatFromBaseIds(
  derived: CatalogDerived,
  baseIds: readonly number[],
  formatId: FormatId,
  setIndex: SetIndex | null | undefined,
): number {
  const format = getFormatById(formatId);
  if (format?.poolRule === 'full-tcg' && format.banlistSource !== 'genesys-points') {
    return baseIds.length;
  }
  return filterCatalogIdsByFormatPool(baseIds, derived.cardById, formatId, setIndex).length;
}

/**
 * Match counts per format if that format were selected, with the same query and facet filters.
 * Returns undefined when the catalog has too many formats (avoids hundreds of full queries).
 */
export function computeFormatOptionPoolCounts(
  derived: CatalogDerived,
  options: {
    filterState: FilterState;
    query?: string;
    setIndex?: SetIndex | null;
    /** When counts are capped, still show the active format's pool size. */
    activeFormatId?: FormatId | null;
  },
): FormatOptionPoolCounts | undefined {
  const formats = listFormats();
  if (formats.length > MAX_FORMATS_WITH_POOL_OPTION_COUNTS) {
    if (!options.activeFormatId) return undefined;
    return {
      [options.activeFormatId]: queryCatalog(derived, {
        filterState: options.filterState,
        query: options.query,
        formatParam: options.activeFormatId,
        setIndex: options.setIndex,
      }).matchCount,
    };
  }

  if (filterStateHasBanStatusSelection(options.filterState)) {
    const counts: Partial<Record<FormatId, number>> = {};
    for (const format of formats) {
      counts[format.id] = queryCatalog(derived, {
        filterState: options.filterState,
        query: options.query,
        formatParam: format.id,
        setIndex: options.setIndex,
      }).matchCount;
    }
    return counts;
  }

  const base = queryCatalog(derived, {
    filterState: options.filterState,
    query: options.query,
    formatParam: null,
    setIndex: options.setIndex,
  });

  const counts: Partial<Record<FormatId, number>> = {};
  for (const format of formats) {
    counts[format.id] = countForFormatFromBaseIds(derived, base.ids, format.id, options.setIndex);
  }
  return counts;
}
