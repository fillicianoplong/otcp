import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';

export const CATALOG_VIEW_QUERY_KEY = 'view';

/** Viewport width (px) at which Table is offered and List is mapped to Table. Matches Tailwind `md`. */
export const CATALOG_WIDE_LAYOUT_MIN_WIDTH_PX = 768;

/** Per-page keys so Lists and Collection can add their own later. */
export const CATALOG_VIEW_STORAGE_KEY_SEARCH = 'otcp:view:search';

export type CatalogViewMode = 'grid' | 'list' | 'table';

export function parseCatalogViewMode(raw: string | null | undefined): CatalogViewMode {
  if (raw === 'list') return 'list';
  if (raw === 'table') return 'table';
  return 'grid';
}

export function isCatalogViewMode(value: string): value is CatalogViewMode {
  return value === 'grid' || value === 'list' || value === 'table';
}

/** Maps stored preference to the view rendered at the current viewport without mutating storage. */
export function effectiveCatalogViewMode(
  mode: CatalogViewMode,
  options?: { tableAvailable?: boolean },
): CatalogViewMode {
  const tableAvailable = options?.tableAvailable !== false;
  if (!tableAvailable) {
    if (mode === 'table') return 'list';
    return mode;
  }
  if (mode === 'list') return 'table';
  return mode;
}

export type ResolvedCatalogViewPreference = {
  mode: CatalogViewMode;
  /** Set when localStorage had a non-mode value and the URL did not override. */
  invalidStored: boolean;
};

export function readCatalogViewPreference(storageKey: string): string | null {
  return readLocalStorageString(storageKey);
}

export function writeCatalogViewPreference(storageKey: string, mode: CatalogViewMode): void {
  writeLocalStorageString(storageKey, mode);
}

/** URL param wins, then stored value, then default (Grid on Search). */
export function resolveCatalogViewPreference(options: {
  urlParam: string | null;
  storedRaw: string | null;
  defaultMode: CatalogViewMode;
}): ResolvedCatalogViewPreference {
  const { urlParam, storedRaw, defaultMode } = options;
  if (urlParam !== null) {
    return { mode: parseCatalogViewMode(urlParam), invalidStored: false };
  }
  if (storedRaw !== null && isCatalogViewMode(storedRaw)) {
    return { mode: storedRaw, invalidStored: false };
  }
  if (storedRaw !== null) {
    return { mode: defaultMode, invalidStored: true };
  }
  return { mode: defaultMode, invalidStored: false };
}

/** Applies invalid-stored and narrow-table fallbacks without mutating storage. */
export function displayCatalogViewMode(
  resolved: ResolvedCatalogViewPreference,
  options?: { tableAvailable?: boolean },
): CatalogViewMode {
  if (resolved.invalidStored) {
    return options?.tableAvailable === false ? 'list' : 'grid';
  }
  return effectiveCatalogViewMode(resolved.mode, options);
}
