/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listFormatsNewestFirst } from '../format/formatCatalog.ts';
import { readFormatPreference } from '../format/formatPreference.ts';
import { FormatsPage } from './FormatsPage.tsx';

function renderFormatsPage() {
  const router = createMemoryRouter(
    [
      { path: '/formats', element: <FormatsPage /> },
      { path: '/formats/:formatId', element: <div>Format detail</div> },
      { path: '/search', element: <div>Search</div> },
    ],
    { initialEntries: ['/formats'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});

describe('FormatsPage rows', () => {
  it('keeps newest-first name-only links', () => {
    renderFormatsPage();
    const table = screen.getByRole('table');
    const links = within(table).getAllByRole('link');
    const names = listFormatsNewestFirst().map((format) => format.name);

    expect(links.map((link) => link.textContent)).toEqual(names);
    expect(names.slice(0, 4)).toEqual(['Advanced', 'Traditional', 'Speed Duel', 'Genesys']);
    for (const link of links) {
      expect(link.textContent ?? '').not.toContain('·');
    }
    expect(within(table).getByRole('columnheader', { name: 'List date' })).toBeTruthy();
    expect(within(table).getByRole('columnheader', { name: 'Pool through' })).toBeTruthy();
    expect(within(table).getByRole('columnheader', { name: 'Forbidden' })).toBeTruthy();
  });

  it('makes each data cell a hit target while exposing one link per row', () => {
    renderFormatsPage();
    const rows = document.querySelectorAll<HTMLTableRowElement>('tbody tr');
    expect(rows.length).toBe(listFormatsNewestFirst().length);

    for (const row of rows) {
      expect(within(row as HTMLElement).getAllByRole('link')).toHaveLength(1);
      const primary = row.querySelector<HTMLAnchorElement>('[data-formats-row-link]');
      const hits = row.querySelectorAll<HTMLAnchorElement>('a[data-formats-row-hit]');
      expect(primary).not.toBeNull();
      expect(hits).toHaveLength(row.cells.length - 1);
      expect(primary?.getAttribute('href')).toBe(hits[0]?.getAttribute('href'));
      expect(row.className).toContain('formats-data-row');
      expect(row.className).toContain('hover:bg-surface-2/60');

      for (const cell of Array.from(row.cells).slice(1)) {
        const hit = cell.querySelector('a[data-formats-row-hit]');
        const content = cell.querySelector('span');
        expect(hit?.getAttribute('tabindex')).toBe('-1');
        expect(hit?.getAttribute('aria-hidden')).toBe('true');
        expect(hit?.contains(content)).toBe(false);
        expect(content?.closest('a')).toBeNull();
      }
    }
  });

  it('saves the preferred format when the name link is activated', async () => {
    const user = userEvent.setup();
    const router = renderFormatsPage();
    const goat = screen.getByRole('link', { name: 'GOAT' });

    goat.focus();
    await user.keyboard('{Enter}');

    expect(readFormatPreference()).toBe('goat');
    expect(router.state.location.pathname).toBe('/formats/goat');
  });

  it('saves the preferred format when a non-name cell hit target is clicked', async () => {
    const user = userEvent.setup();
    const router = renderFormatsPage();
    const goat = screen.getByRole('link', { name: 'GOAT' });
    const row = goat.closest('tr');
    const dateHit = row?.querySelector<HTMLAnchorElement>('a[data-formats-row-hit]');
    expect(dateHit).not.toBeNull();

    await user.click(dateHit!);

    expect(readFormatPreference()).toBe('goat');
    expect(router.state.location.pathname).toBe('/formats/goat');
  });
});
