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

/** Table lands in issue #29; keep grid when table is requested until then. */
export function effectiveCatalogViewMode(mode: CatalogViewMode): 'grid' | 'list' {
  return mode === 'list' ? 'list' : 'grid';
}
