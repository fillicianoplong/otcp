/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CatalogSortSelect } from './CatalogSortSelect.tsx';

afterEach(() => {
  cleanup();
});

describe('CatalogSortSelect', () => {
  it('shows the field and arrow in one control sized to the longest option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CatalogSortSelect sort={{ column: 'name', direction: 'asc' }} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Name ↑' });
    expect(trigger.className).toContain('h-control');
    expect(trigger.className).toContain('rounded-md');
    expect(screen.queryByText(/^Sort$/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ascending' })).toBeNull();

    const measured = [...trigger.querySelectorAll('[data-sort-sizer]')].map(
      (node) => node.textContent,
    );
    expect(measured).toContain('Card type');
    expect(measured).toContain('Archetype');
    expect(measured).toContain('Descending');
    const [arrow, chevron] = [...trigger.querySelectorAll('svg')];
    expect(arrow?.getAttribute('class')).toContain('h-4');
    expect(arrow?.getAttribute('class')).toContain('w-4');
    expect(arrow?.querySelector('path')?.getAttribute('d')).toContain('M8 13V3.5');
    expect(chevron?.querySelector('path')?.getAttribute('d')).toBe('M4 6.5 8 10.5 12 6.5');
    expect(trigger.textContent).not.toContain('↑');

    await user.click(trigger);
    const menu = screen.getByRole('menu', { name: 'Name ↑' });
    expect(menu.style.width).toBe(`${trigger.offsetWidth}px`);
    expect(menu.className).not.toMatch(/min-w-\[/);
    expect(menu.className).not.toContain('w-max');
    expect(within(menu).getByRole('separator')).toBeTruthy();

    const name = within(menu).getByRole('menuitemradio', { name: 'Name' });
    expect(name).toHaveAttribute('aria-checked', 'true');
    expect(within(menu).getByRole('menuitemradio', { name: 'Ascending' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(within(menu).getByRole('menuitemradio', { name: 'Descending' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(name.className).toContain('py-1.5');
    expect(name.className).not.toContain('min-h-touch');
    expect(name.firstElementChild?.textContent).toBe('Name');
    expect(name.lastElementChild?.querySelector('svg')).toBeTruthy();
    const descending = within(menu).getByRole('menuitemradio', { name: 'Descending' });
    expect(descending.lastElementChild?.querySelector('svg')).toBeNull();

    await user.click(within(menu).getByRole('menuitemradio', { name: 'Ban' }));
    expect(onChange).toHaveBeenCalledWith({ column: 'ban', direction: 'asc' });
  });

  it('changes direction from the same menu and keeps the field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CatalogSortSelect sort={{ column: 'atk', direction: 'desc' }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'ATK ↓' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Ascending' }));
    expect(onChange).toHaveBeenCalledWith({ column: 'atk', direction: 'asc' });
  });
});
