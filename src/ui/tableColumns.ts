/** A column a table toolbar can show or hide. Locked columns stay visible. */
export type TableColumn = {
  id: string;
  label: string;
  locked?: boolean;
  /** Omitted columns start visible. */
  defaultVisible?: boolean;
  /** Sort actions appear on the header menu only when this is set. */
  sortable?: boolean;
};

export type ColumnSortDirection = 'asc' | 'desc';

export type ColumnSortState = {
  columnId: string;
  direction: ColumnSortDirection;
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

export function columnMenuButtonLabel(label: string): string {
  return `${label} column menu`;
}

/**
 * `columns` is the order I defined the table in. I keep each locked column in that
 * slot (Name, Set, and the rest stay put) and only reorder columns that can move.
 * Unknown ids in a saved order are dropped, and any new column is appended.
 */
export function normalizeTableColumnOrder(
  columns: readonly TableColumn[],
  order: readonly string[] | null | undefined,
): string[] {
  const movableIds = columns.filter((column) => !column.locked).map((column) => column.id);
  const known = new Set(movableIds);
  const seen = new Set<string>();
  const movable: string[] = [];
  for (const id of order ?? []) {
    if (!known.has(id) || seen.has(id)) continue;
    movable.push(id);
    seen.add(id);
  }
  for (const id of movableIds) {
    if (!seen.has(id)) movable.push(id);
  }
  const result: string[] = [];
  let cursor = 0;
  for (const column of columns) {
    if (column.locked) result.push(column.id);
    else result.push(movable[cursor++]!);
  }
  return result;
}

export function orderedVisibleTableColumns(
  columns: readonly TableColumn[],
  visibility: Readonly<Partial<TableColumnVisibility>>,
  order: readonly string[] | null | undefined,
): TableColumn[] {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const visible: TableColumn[] = [];
  for (const id of normalizeTableColumnOrder(columns, order)) {
    const column = byId.get(id);
    if (column && isTableColumnVisible(column, visibility)) visible.push(column);
  }
  return visible;
}

export function setTableColumnVisible(
  columns: readonly TableColumn[],
  visibility: Readonly<Partial<TableColumnVisibility>>,
  id: string,
  visible: boolean,
): TableColumnVisibility {
  const next = defaultTableColumnVisibility(columns);
  for (const column of columns) {
    if (column.locked) continue;
    next[column.id] = isTableColumnVisible(column, visibility);
  }
  const column = columns.find((entry) => entry.id === id);
  if (!column || column.locked) return next;
  next[id] = visible;
  return next;
}

export function canMoveTableColumn(
  columns: readonly TableColumn[],
  visibility: Readonly<Partial<TableColumnVisibility>>,
  order: readonly string[] | null | undefined,
  id: string,
  direction: -1 | 1,
): boolean {
  const column = columns.find((entry) => entry.id === id);
  if (!column || column.locked) return false;
  const visible = orderedVisibleTableColumns(columns, visibility, order);
  const index = visible.findIndex((entry) => entry.id === id);
  const neighbor = visible[index + direction];
  if (!neighbor || neighbor.locked) return false;
  return true;
}

export function moveTableColumn(
  columns: readonly TableColumn[],
  visibility: Readonly<Partial<TableColumnVisibility>>,
  order: readonly string[] | null | undefined,
  id: string,
  direction: -1 | 1,
): string[] {
  const normalized = normalizeTableColumnOrder(columns, order);
  if (!canMoveTableColumn(columns, visibility, normalized, id, direction)) return normalized;
  const visible = orderedVisibleTableColumns(columns, visibility, normalized);
  const index = visible.findIndex((entry) => entry.id === id);
  const neighbor = visible[index + direction];
  if (!neighbor) return normalized;
  const next = [...normalized];
  const from = next.indexOf(id);
  const to = next.indexOf(neighbor.id);
  next[from] = neighbor.id;
  next[to] = id;
  return normalizeTableColumnOrder(columns, next);
}

export function toggleColumnSort(
  current: ColumnSortState | null | undefined,
  columnId: string,
): ColumnSortState {
  if (current?.columnId === columnId) {
    return { columnId, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { columnId, direction: 'asc' };
}
