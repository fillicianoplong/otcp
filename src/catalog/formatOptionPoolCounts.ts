import { listFormats, type FormatId } from '../format/formatCatalog.ts';
import type { SetIndex } from '../shared/schema/setIndex.ts';
import type { CatalogDerived } from './catalogDerived.ts';
import { queryCatalog } from './catalogQueryCache.ts';
import type { FilterState } from './filterEngine.ts';

export type FormatOptionPoolCounts = Readonly<Partial<Record<FormatId, number>>>;

/** Match counts per format if that format were selected, with the same query and facet filters. */
export function computeFormatOptionPoolCounts(
  derived: CatalogDerived,
  options: {
    filterState: FilterState;
    query?: string;
    setIndex?: SetIndex | null;
  },
): FormatOptionPoolCounts {
  const counts: Partial<Record<FormatId, number>> = {};
  for (const format of listFormats()) {
    counts[format.id] = queryCatalog(derived, {
      filterState: options.filterState,
      query: options.query,
      formatParam: format.id,
      setIndex: options.setIndex,
    }).matchCount;
  }
  return counts;
}
