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
  it('shows the field name, lists fields, and toggles direction from the arrow', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CatalogSortSelect sort={{ column: 'name', direction: 'asc' }} onChange={onChange} />);

    const field = screen.getByRole('button', { name: 'Name' });
    expect(field.className).toContain('h-full');
    expect(field.closest('div')?.className).toContain('h-control');
    expect(field.closest('div')?.className).toContain('rounded-md');
    expect(screen.queryByText(/sort/i)).toBeNull();

    await user.click(field);
    const menu = screen.getByRole('menu');
    expect(menu.className).toContain('w-max');
    expect(menu.className).toContain('min-w-max');
    expect(menu.className).not.toMatch(/min-w-\[/);
    const item = screen.getByRole('menuitemradio', { name: 'Name' });
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(item.className).toContain('py-1.5');
    expect(item.className).not.toContain('min-h-touch');
    await user.click(screen.getByRole('menuitemradio', { name: 'Ban' }));
    expect(onChange).toHaveBeenCalledWith({ column: 'ban', direction: 'asc' });

    await user.click(screen.getByRole('button', { name: 'Ascending' }));
    expect(onChange).toHaveBeenCalledWith({ column: 'name', direction: 'desc' });
  });
});
