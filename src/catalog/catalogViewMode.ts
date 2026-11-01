export const CATALOG_VIEW_QUERY_KEY = 'view';

export type CatalogViewMode = 'grid' | 'list' | 'table';

export function parseCatalogViewMode(raw: string | null | undefined): CatalogViewMode {
  if (raw === 'list') return 'list';
  if (raw === 'table') return 'table';
  return 'grid';
}

export function isCatalogViewMode(value: string): value is CatalogViewMode {
  return value === 'grid' || value === 'list' || value === 'table';
}

/** When Table is unavailable (narrow viewport), fall back to List. */
export function effectiveCatalogViewMode(
  mode: CatalogViewMode,
  options?: { tableAvailable?: boolean },
): CatalogViewMode {
  if (mode === 'table' && options?.tableAvailable === false) return 'list';
  return mode;
}
