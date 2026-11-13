/** A column a table toolbar can show or hide. Locked columns stay visible. */
export type TableColumn = {
  id: string;
  label: string;
  locked?: boolean;
  /** Omitted columns start visible. */
  defaultVisible?: boolean;
};

export type TableColumnVisibility = Record<string, boolean>;

export const TABLE_COLUMN_STORAGE_PREFIX = 'otcp:table-columns:';

export function defaultTableColumnVisibility(
  columns: readonly TableColumn[],
): TableColumnVisibility {
  const visibility: TableColumnVisibility = {};
  for (const column of columns) {
    if (column.locked) continue;
    visibility[column.id] = column.defaultVisible !== false;
  }
  return visibility;
}

export function isTableColumnVisible(
  column: TableColumn,
  visibility: Readonly<Partial<TableColumnVisibility>>,
): boolean {
  if (column.locked) return true;
  const value = visibility[column.id];
  if (typeof value === 'boolean') return value;
  return column.defaultVisible !== false;
}

export function visibleTableColumns(
  columns: readonly TableColumn[],
  visibility: Readonly<Partial<TableColumnVisibility>>,
): TableColumn[] {
  return columns.filter((column) => isTableColumnVisible(column, visibility));
}

/** Apply a saved map onto the column defaults. Unknown keys are ignored. */
export function tableColumnVisibilityFromRecord(
  columns: readonly TableColumn[],
  record: Readonly<Record<string, unknown>> | null,
): TableColumnVisibility {
  const visibility = defaultTableColumnVisibility(columns);
  if (!record) return visibility;
  for (const column of columns) {
    if (column.locked) continue;
    const value = record[column.id];
    if (typeof value === 'boolean') visibility[column.id] = value;
  }
  return visibility;
}
