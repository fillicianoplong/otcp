/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';
import { PRIMARY_NAV } from '../nav';
import { SearchPage } from '../pages/SearchPage';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/formats" element={<h1>Formats</h1>} />
          <Route path="/decks" element={<h1>Decks</h1>} />
          <Route path="/collection" element={<h1>Collection</h1>} />
          <Route path="/lists" element={<h1>Lists</h1>} />
          <Route path="/account" element={<h1>Account</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe('AppShell', () => {
  it('renders all primary nav links in the desktop nav', () => {
    renderAt('/search');

    const desktopNav = screen.getByRole('navigation', { name: 'Primary' });
    for (const { label } of PRIMARY_NAV) {
      expect(within(desktopNav).getAllByRole('link', { name: label }).length).toBeGreaterThan(0);
    }
  });

  it('marks the active route with aria-current="page"', () => {
    renderAt('/formats');

    const desktopNav = screen.getByRole('navigation', { name: 'Primary' });
    const formatsLink = within(desktopNav).getAllByRole('link', { name: 'Formats' })[0];
    expect(formatsLink.getAttribute('aria-current')).toBe('page');

    const searchLink = within(desktopNav).getAllByRole('link', { name: 'Search' })[0];
    expect(searchLink.getAttribute('aria-current')).toBeNull();
  });

  it('toggles the phone menu and closes it with Escape', async () => {
    const user = userEvent.setup();
    renderAt('/search');

    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');

    await user.click(menuButton);
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    expect(menuButton.getAttribute('aria-controls')).toBeTruthy();

    await user.keyboard('{Escape}');
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menuButton);
  });
});
