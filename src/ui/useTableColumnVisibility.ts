import { useCallback, useState } from 'react';

import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';
import {
  defaultTableColumnVisibility,
  normalizeTableColumnOrder,
  tableColumnVisibilityFromRecord,
  TABLE_COLUMN_STORAGE_PREFIX,
  type TableColumn,
  type TableColumnVisibility,
} from './tableColumns.ts';

function storageKeyFor(tableId: string): string {
  return `${TABLE_COLUMN_STORAGE_PREFIX}${tableId}`;
}

export type TableColumnSetup = {
  visibility: TableColumnVisibility;
  order: string[];
};

function fallbackSetup(columns: readonly TableColumn[]): TableColumnSetup {
  return {
    visibility: defaultTableColumnVisibility(columns),
    order: normalizeTableColumnOrder(columns, null),
  };
}

/**
 * Older saves were a flat map of column id to boolean. I still read those.
 * New saves store visibility and order together so every header menu shares one setup.
 */
export function readStoredTableColumnSetup(
  tableId: string,
  columns: readonly TableColumn[],
): TableColumnSetup {
  const raw = readLocalStorageString(storageKeyFor(tableId));
  if (raw === null) return fallbackSetup(columns);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fallbackSetup(columns);
    }
    const record = parsed as Record<string, unknown>;
    const visibilityRecord =
      record.visibility &&
      typeof record.visibility === 'object' &&
      !Array.isArray(record.visibility)
        ? (record.visibility as Record<string, unknown>)
        : record;
    const order = Array.isArray(record.order)
      ? record.order.filter((id) => typeof id === 'string')
      : null;
    return {
      visibility: tableColumnVisibilityFromRecord(columns, visibilityRecord),
      order: normalizeTableColumnOrder(columns, order),
    };
  } catch {
    return fallbackSetup(columns);
  }
}

export function readStoredTableColumnVisibility(
  tableId: string,
  columns: readonly TableColumn[],
): TableColumnVisibility {
  return readStoredTableColumnSetup(tableId, columns).visibility;
}

function writeStoredTableColumnSetup(storageKey: string, setup: TableColumnSetup): void {
  writeLocalStorageString(storageKey, JSON.stringify(setup));
}

/** Per-table column visibility and order, remembered in the same localStorage key. */
export function useTableColumnSetup(
  tableId: string,
  columns: readonly TableColumn[],
): {
  visibility: TableColumnVisibility;
  order: readonly string[];
  setVisibility: (next: TableColumnVisibility) => void;
  setOrder: (next: readonly string[]) => void;
} {
  const storageKey = storageKeyFor(tableId);
  const [setup, setSetup] = useState(() => readStoredTableColumnSetup(tableId, columns));

  const setVisibility = useCallback(
    (next: TableColumnVisibility) => {
      setSetup((current) => {
        const stored: TableColumnSetup = {
          visibility: tableColumnVisibilityFromRecord(columns, next),
          order: normalizeTableColumnOrder(columns, current.order),
        };
        writeStoredTableColumnSetup(storageKey, stored);
        return stored;
      });
    },
    [columns, storageKey],
  );

  const setOrder = useCallback(
    (next: readonly string[]) => {
      setSetup((current) => {
        const stored: TableColumnSetup = {
          visibility: current.visibility,
          order: normalizeTableColumnOrder(columns, next),
        };
        writeStoredTableColumnSetup(storageKey, stored);
        return stored;
      });
    },
    [columns, storageKey],
  );

  return {
    visibility: setup.visibility,
    order: setup.order,
    setVisibility,
    setOrder,
  };
}

/** Per-table column visibility, remembered in localStorage the same way Search remembers a setup. */
export function useTableColumnVisibility(
  tableId: string,
  columns: readonly TableColumn[],
): readonly [TableColumnVisibility, (next: TableColumnVisibility) => void] {
  const { visibility, setVisibility } = useTableColumnSetup(tableId, columns);
  return [visibility, setVisibility] as const;
}
