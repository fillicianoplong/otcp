import { describe, expect, it } from 'vitest';

import {
  canMoveTableColumn,
  defaultTableColumnVisibility,
  isTableColumnVisible,
  moveTableColumn,
  normalizeTableColumnOrder,
  orderedVisibleTableColumns,
  setTableColumnVisible,
  tableColumnVisibilityFromRecord,
  visibleTableColumns,
  type TableColumn,
} from './tableColumns.ts';

const COLUMNS: readonly TableColumn[] = [
  { id: 'name', label: 'Name', locked: true },
  { id: 'qty', label: 'Qty' },
  { id: 'note', label: 'Note', defaultVisible: false },
];

describe('tableColumns', () => {
  it('keeps locked columns visible and honors defaults', () => {
    const visibility = defaultTableColumnVisibility(COLUMNS);
    expect(visibility).toEqual({ qty: true, note: false });
    expect(isTableColumnVisible(COLUMNS[0]!, visibility)).toBe(true);
    expect(isTableColumnVisible(COLUMNS[1]!, visibility)).toBe(true);
    expect(isTableColumnVisible(COLUMNS[2]!, visibility)).toBe(false);
    expect(visibleTableColumns(COLUMNS, visibility).map((column) => column.id)).toEqual([
      'name',
      'qty',
    ]);
  });

  it('applies only known boolean keys from storage', () => {
    const visibility = tableColumnVisibilityFromRecord(COLUMNS, {
      qty: false,
      note: true,
      extra: true,
      name: false,
    });
    expect(visibility.qty).toBe(false);
    expect(visibility.note).toBe(true);
    expect(visibility).not.toHaveProperty('extra');
    expect(isTableColumnVisible(COLUMNS[0]!, visibility)).toBe(true);
  });

  it('keeps a locked column in place and moves the others', () => {
    const visibility = defaultTableColumnVisibility(COLUMNS);
    expect(normalizeTableColumnOrder(COLUMNS, ['note', 'qty', 'name'])).toEqual([
      'name',
      'note',
      'qty',
    ]);
    expect(canMoveTableColumn(COLUMNS, visibility, null, 'name', 1)).toBe(false);
    expect(canMoveTableColumn(COLUMNS, visibility, null, 'qty', -1)).toBe(false);
    expect(canMoveTableColumn(COLUMNS, visibility, null, 'qty', 1)).toBe(false);
    expect(setTableColumnVisible(COLUMNS, visibility, 'name', false).qty).toBe(true);
    expect(
      isTableColumnVisible(COLUMNS[0]!, setTableColumnVisible(COLUMNS, visibility, 'name', false)),
    ).toBe(true);

    const withNote = setTableColumnVisible(COLUMNS, visibility, 'note', true);
    expect(orderedVisibleTableColumns(COLUMNS, withNote, null).map((column) => column.id)).toEqual([
      'name',
      'qty',
      'note',
    ]);
    expect(moveTableColumn(COLUMNS, withNote, null, 'note', -1)).toEqual(['name', 'note', 'qty']);
    expect(canMoveTableColumn(COLUMNS, withNote, ['name', 'note', 'qty'], 'note', 1)).toBe(true);
    expect(canMoveTableColumn(COLUMNS, withNote, ['name', 'note', 'qty'], 'qty', 1)).toBe(false);
  });
});
