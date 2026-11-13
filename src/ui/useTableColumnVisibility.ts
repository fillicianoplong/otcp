import { useCallback, useState } from 'react';

import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';
import {
  TABLE_COLUMN_STORAGE_PREFIX,
  tableColumnVisibilityFromRecord,
  type TableColumn,
  type TableColumnVisibility,
} from './tableColumns.ts';

function storageKeyFor(tableId: string): string {
  return `${TABLE_COLUMN_STORAGE_PREFIX}${tableId}`;
}

export function readStoredTableColumnVisibility(
  tableId: string,
  columns: readonly TableColumn[],
): TableColumnVisibility {
  const raw = readLocalStorageString(storageKeyFor(tableId));
  if (raw === null) return tableColumnVisibilityFromRecord(columns, null);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return tableColumnVisibilityFromRecord(columns, null);
    }
    return tableColumnVisibilityFromRecord(columns, parsed as Record<string, unknown>);
  } catch {
    return tableColumnVisibilityFromRecord(columns, null);
  }
}

/** Per-table column visibility, remembered in localStorage the same way Search remembers a setup. */
export function useTableColumnVisibility(
  tableId: string,
  columns: readonly TableColumn[],
): readonly [TableColumnVisibility, (next: TableColumnVisibility) => void] {
  const storageKey = storageKeyFor(tableId);
  const [visibility, setVisibility] = useState(() =>
    readStoredTableColumnVisibility(tableId, columns),
  );
  const onVisibilityChange = useCallback(
    (next: TableColumnVisibility) => {
      setVisibility(next);
      writeLocalStorageString(storageKey, JSON.stringify(next));
    },
    [storageKey],
  );
  return [visibility, onVisibilityChange] as const;
}
