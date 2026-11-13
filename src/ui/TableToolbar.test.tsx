/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { TableToolbar } from './TableToolbar.tsx';
import {
  defaultTableColumnVisibility,
  type TableColumn,
  type TableColumnVisibility,
} from './tableColumns.ts';

const COLUMNS: readonly TableColumn[] = [
  { id: 'name', label: 'Name', locked: true },
  { id: 'atk', label: 'ATK' },
  { id: 'def', label: 'DEF' },
];

function Harness() {
  const [visibility, setVisibility] = useState<TableColumnVisibility>(() =>
    defaultTableColumnVisibility(COLUMNS),
  );
  return (
    <TableToolbar columns={COLUMNS} visibility={visibility} onVisibilityChange={setVisibility} />
  );
}

afterEach(() => {
  cleanup();
});

describe('TableToolbar', () => {
  it('toggles an optional column and leaves locked columns out of the menu', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Columns' }));
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Name' })).toBeNull();
    const atk = screen.getByRole('menuitemcheckbox', { name: 'ATK' });
    expect(atk).toHaveAttribute('aria-checked', 'true');

    await user.click(atk);
    expect(screen.getByRole('menuitemcheckbox', { name: 'ATK' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('menuitemcheckbox', { name: 'DEF' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
