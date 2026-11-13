/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { TableColumn } from './tableColumns.ts';
import { readStoredTableColumnSetup, useTableColumnSetup } from './useTableColumnVisibility.ts';

const COLUMNS: readonly TableColumn[] = [
  { id: 'name', label: 'Name', locked: true },
  { id: 'qty', label: 'Qty' },
  { id: 'note', label: 'Note', defaultVisible: false },
];

afterEach(() => {
  localStorage.clear();
});

describe('useTableColumnSetup', () => {
  it('reads a legacy visibility map and keeps order in the same save', () => {
    localStorage.setItem('otcp:table-columns:demo', JSON.stringify({ qty: false, note: true }));
    const { result } = renderHook(() => useTableColumnSetup('demo', COLUMNS));
    expect(result.current.visibility).toEqual({ qty: false, note: true });
    expect(result.current.order).toEqual(['name', 'qty', 'note']);

    act(() => {
      result.current.setOrder(['name', 'note', 'qty']);
    });

    expect(readStoredTableColumnSetup('demo', COLUMNS)).toEqual({
      visibility: { qty: false, note: true },
      order: ['name', 'note', 'qty'],
    });
  });
});
