import {
  CATALOG_TABLE_SORTABLE_COLUMN_DEFS,
  type CatalogTableSortColumnId,
} from './catalogTableColumns.ts';
import {
  DEFAULT_CATALOG_TABLE_SORT,
  isDefaultCatalogTableSort,
  type CatalogTableSortDirection,
  type CatalogTableSortState,
} from './catalogTableSort.ts';

/** Column id for the shared grid/table sort. Omitted with the direction when both are the default. */
export const CATALOG_SORT_QUERY_KEY = 'sort';

/** `asc` or `desc`. Omitted together with the column when the sort is the default. */
export const CATALOG_SORT_DIR_QUERY_KEY = 'dir';

const SORT_COLUMN_IDS = new Set<CatalogTableSortColumnId>(
  CATALOG_TABLE_SORTABLE_COLUMN_DEFS.map((column) => column.id),
);

function isSortColumn(value: string): value is CatalogTableSortColumnId {
  return SORT_COLUMN_IDS.has(value as CatalogTableSortColumnId);
}

/** Parsed sort from the query, or null when the query does not mention a sort. */
export function readCatalogTableSortFromParams(
  params: URLSearchParams,
): CatalogTableSortState | null {
  if (!params.has(CATALOG_SORT_QUERY_KEY) && !params.has(CATALOG_SORT_DIR_QUERY_KEY)) {
    return null;
  }
  const columnRaw = params.get(CATALOG_SORT_QUERY_KEY);
  const directionRaw = params.get(CATALOG_SORT_DIR_QUERY_KEY);
  const column =
    columnRaw !== null && isSortColumn(columnRaw) ? columnRaw : DEFAULT_CATALOG_TABLE_SORT.column;
  const direction: CatalogTableSortDirection = directionRaw === 'desc' ? 'desc' : 'asc';
  return { column, direction };
}

export function writeCatalogTableSortToParams(
  params: URLSearchParams,
  sort: CatalogTableSortState,
): void {
  if (isDefaultCatalogTableSort(sort)) {
    params.delete(CATALOG_SORT_QUERY_KEY);
    params.delete(CATALOG_SORT_DIR_QUERY_KEY);
    return;
  }
  params.set(CATALOG_SORT_QUERY_KEY, sort.column);
  params.set(CATALOG_SORT_DIR_QUERY_KEY, sort.direction);
}
