import {
  DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY,
  type CatalogTableColumnVisibility,
  type CatalogTableOptionalColumnId,
} from './catalogTableColumns.ts';
import {
  DEFAULT_CATALOG_TABLE_SORT,
  type CatalogTableSortState,
  type CatalogTableSortDirection,
} from './catalogTableSort.ts';
import type { CatalogTableSortColumnId } from './catalogTableColumns.ts';
import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';

/** Per-table search setup in localStorage (guest fallback; seeds profile when signed in). */
export const CATALOG_TABLE_PREFS_STORAGE_KEY_SEARCH = 'otcp:table-prefs:search';

export type SearchTablePrefsSnapshot = {
  visibility: CatalogTableColumnVisibility;
  sort: CatalogTableSortState;
};

const OPTIONAL_COLUMN_IDS = new Set<CatalogTableOptionalColumnId>(
  Object.keys(DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY) as CatalogTableOptionalColumnId[],
);

const SORT_COLUMNS = new Set<CatalogTableSortColumnId>([
  'name',
  'cardType',
  'attribute',
  'type',
  'level',
  'atk',
  'def',
  'archetype',
  'price',
  'ban',
]);

function isOptionalColumnId(value: string): value is CatalogTableOptionalColumnId {
  return OPTIONAL_COLUMN_IDS.has(value as CatalogTableOptionalColumnId);
}

function parseVisibility(raw: unknown): CatalogTableColumnVisibility | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const visibility = { ...DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY };
  for (const [key, value] of Object.entries(record)) {
    if (!isOptionalColumnId(key) || typeof value !== 'boolean') {
      return null;
    }
    visibility[key] = value;
  }
  return visibility;
}

function parseSort(raw: unknown): CatalogTableSortState | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const column = record.column;
  const direction = record.direction;
  if (typeof column !== 'string' || !SORT_COLUMNS.has(column as CatalogTableSortColumnId)) {
    return null;
  }
  if (direction !== 'asc' && direction !== 'desc') {
    return null;
  }
  return {
    column: column as CatalogTableSortColumnId,
    direction: direction as CatalogTableSortDirection,
  };
}

export function parseSearchTablePrefsSnapshot(raw: unknown): SearchTablePrefsSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const visibility = parseVisibility(record.visibility);
  const sort = parseSort(record.sort);
  if (!visibility || !sort) return null;
  return { visibility, sort };
}

export function readSearchTablePrefsFromLocalStorage(): SearchTablePrefsSnapshot | null {
  const raw = readLocalStorageString(CATALOG_TABLE_PREFS_STORAGE_KEY_SEARCH);
  if (raw === null) return null;
  try {
    return parseSearchTablePrefsSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeSearchTablePrefsToLocalStorage(snapshot: SearchTablePrefsSnapshot): void {
  writeLocalStorageString(CATALOG_TABLE_PREFS_STORAGE_KEY_SEARCH, JSON.stringify(snapshot));
}

export function defaultSearchTablePrefsSnapshot(): SearchTablePrefsSnapshot {
  return {
    visibility: { ...DEFAULT_CATALOG_TABLE_COLUMN_VISIBILITY },
    sort: { ...DEFAULT_CATALOG_TABLE_SORT },
  };
}
