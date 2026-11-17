/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { ColumnHeader } from './ColumnHeader.tsx';
import { TableToolbar } from './TableToolbar.tsx';
import {
  columnMenuButtonLabel,
  defaultTableColumnVisibility,
  normalizeTableColumnOrder,
  orderedVisibleTableColumns,
  type ColumnSortState,
  type TableColumn,
  type TableColumnVisibility,
} from './tableColumns.ts';

const COLUMNS: readonly TableColumn[] = [
  { id: 'name', label: 'Name', locked: true, sortable: true },
  { id: 'atk', label: 'ATK', sortable: true },
  { id: 'def', label: 'DEF', sortable: true },
  { id: 'note', label: 'Note', defaultVisible: false, sortable: true },
];

function Harness() {
  const [visibility, setVisibility] = useState<TableColumnVisibility>(() =>
    defaultTableColumnVisibility(COLUMNS),
  );
  const [order, setOrder] = useState<readonly string[]>(() =>
    normalizeTableColumnOrder(COLUMNS, null),
  );
  const [sort, setSort] = useState<ColumnSortState>({ columnId: 'name', direction: 'asc' });
  const shown = orderedVisibleTableColumns(COLUMNS, visibility, order);

  return (
    <>
      <TableToolbar
        columns={COLUMNS}
        visibility={visibility}
        order={order}
        onVisibilityChange={setVisibility}
      />
      <table>
        <thead>
          <tr>
            {shown.map((column) => (
              <ColumnHeader
                key={column.id}
                column={column}
                columns={COLUMNS}
                visibility={visibility}
                order={order}
                onVisibilityChange={setVisibility}
                onOrderChange={setOrder}
                sort={sort}
                onSortChange={setSort}
              />
            ))}
          </tr>
        </thead>
      </table>
    </>
  );
}

afterEach(() => {
  cleanup();
});

describe('ColumnHeader', () => {
  it('keeps the title and kebab on one line and only marks the sorted column', () => {
    render(<Harness />);

    for (const label of ['Name', 'ATK', 'DEF']) {
      const header = screen.getByRole('columnheader', { name: label });
      const row = header.firstElementChild;
      expect(row?.className).toContain('flex-nowrap');
      expect(row?.children).toHaveLength(2);
      expect(header.textContent).not.toContain('↕');
    }

    expect(screen.getByRole('button', { name: 'Name, sorted ascending' }).textContent).toContain(
      '↑',
    );
    expect(screen.getByRole('button', { name: 'Sort by ATK' }).textContent).not.toMatch(/[↑↓]/);
    expect(screen.getByRole('button', { name: 'Sort by DEF' }).textContent).not.toMatch(/[↑↓]/);
  });

  it('sorts from the header and the menu against the same state', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Sort by ATK' }));
    expect(screen.getByRole('button', { name: 'ATK, sorted ascending' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: columnMenuButtonLabel('ATK') }));
    const descending = screen.getByRole('menuitemradio', { name: 'Sort descending' });
    expect(screen.getByRole('menuitemradio', { name: 'Sort ascending' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(descending);
    expect(screen.getByRole('button', { name: 'ATK, sorted descending' })).toBeTruthy();
  });

  it('hides a column and shows it again from Add column', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: columnMenuButtonLabel('ATK') }));
    await user.click(screen.getByRole('menuitem', { name: 'Hide column' }));
    expect(screen.queryByRole('columnheader', { name: 'ATK' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Columns' }));
    expect(screen.getByRole('menuitemcheckbox', { name: 'ATK' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: columnMenuButtonLabel('Name') }));
    await user.click(screen.getByRole('menuitem', { name: 'Add column' }));
    await user.click(screen.getByRole('menuitem', { name: 'ATK' }));
    expect(screen.getByRole('columnheader', { name: 'ATK' })).toBeTruthy();
  });

  it('moves a column and refuses to move the pinned one', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: columnMenuButtonLabel('Name') }));
    expect(screen.getByRole('menuitem', { name: 'Move left' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'Move right' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'Hide column' })).toBeDisabled();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: columnMenuButtonLabel('ATK') }));
    await user.click(screen.getByRole('menuitem', { name: 'Move right' }));
    const labels = screen
      .getAllByRole('columnheader')
      .map((header) => header.getAttribute('aria-label'));
    expect(labels).toEqual(['Name', 'DEF', 'ATK']);
  });

  it('opens with Enter, moves with arrows, and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole('button', { name: columnMenuButtonLabel('DEF') });
    trigger.focus();
    await user.keyboard('{Enter}');
    const menu = screen.getByRole('menu', { name: columnMenuButtonLabel('DEF') });
    expect(menu).toBeTruthy();
    expect(document.activeElement).toHaveAccessibleName('Sort ascending');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Sort descending');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu', { name: columnMenuButtonLabel('DEF') })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
