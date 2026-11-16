/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CatalogSortSelect } from './CatalogSortSelect.tsx';

afterEach(() => {
  cleanup();
});

describe('CatalogSortSelect', () => {
  it('lists sortable columns and toggles direction inside an h-control', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <CatalogSortSelect sort={{ column: 'name', direction: 'asc' }} onChange={onChange} />,
    );

    expect(container.querySelector('.h-control')).toBeTruthy();
    expect(screen.getByText('Sort:')).toBeTruthy();
    const select = screen.getByRole('combobox', { name: 'Sort' });
    expect(select).toHaveValue('name');
    expect(screen.getByRole('option', { name: 'Ban' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'ATK' })).toBeTruthy();

    await user.selectOptions(select, 'ban');
    expect(onChange).toHaveBeenCalledWith({ column: 'ban', direction: 'asc' });

    await user.click(screen.getByRole('button', { name: 'Ascending' }));
    expect(onChange).toHaveBeenCalledWith({ column: 'name', direction: 'desc' });
  });
});
