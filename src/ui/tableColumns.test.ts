import { describe, expect, it } from 'vitest';

import {
  defaultTableColumnVisibility,
  isTableColumnVisible,
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
});
