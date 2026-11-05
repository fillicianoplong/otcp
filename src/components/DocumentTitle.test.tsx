/**
 * @vitest-environment jsdom
 */
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import sampleDevDataset from '../../public/data/datasets/sample-dev.json';
import { CardCatalogProvider } from '../catalog/CardCatalogProvider.tsx';
import { clearCardCatalogCache } from '../catalog/loadCatalog.ts';
import { AuthProvider } from '../shared/auth';
import {
  clearGuestDeckDraftsStorage,
  createGuestDeckDraft,
  updateGuestDeckDraft,
} from '../deckStore/guestDeckDraftStore.ts';
import { OTCP_DATASET_SCHEMA_VERSION_LEGACY } from '../shared/schema/constants.ts';
import { AppShell } from './AppShell.tsx';

function mockCatalogFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('data/current.json')) {
        return new Response(
          JSON.stringify({
            schemaVersion: OTCP_DATASET_SCHEMA_VERSION_LEGACY,
            datasetFile: 'data/datasets/sample-dev.json',
            sha256: 'abc',
            publishedAt: '2026-10-28T12:00:00.000Z',
            cardCount: sampleDevDataset.cards.length,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('data/datasets/sample-dev.json')) {
        return new Response(JSON.stringify(sampleDevDataset), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    }),
  );
}

function renderShell(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <AuthProvider>
            <CardCatalogProvider>
              <AppShell />
            </CardCatalogProvider>
          </AuthProvider>
        ),
        children: [
          { path: '/', element: <h1>Home</h1> },
          { path: '/search', element: <h1>Search</h1> },
          { path: '/search/card/:id', element: <h1>Card</h1> },
          { path: '/formats', element: <h1>Formats</h1> },
          { path: '/formats/:formatId', element: <h1>Format</h1> },
          { path: '/decks', element: <h1>Decks</h1> },
          { path: '/decks/edit/:draftId', element: <h1>Editor</h1> },
          { path: '/collection', element: <h1>Collection</h1> },
          { path: '/lists', element: <h1>Lists</h1> },
          { path: '/about', element: <h1>About</h1> },
          { path: '/account', element: <h1>Account</h1> },
          { path: '*', element: <h1>Page not found</h1> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  document.title = 'OTCP';
  mockCatalogFetch();
});

afterEach(() => {
  cleanup();
  clearGuestDeckDraftsStorage();
  clearCardCatalogCache();
  document.title = 'OTCP';
  vi.unstubAllGlobals();
});

describe('DocumentTitle', () => {
  it('updates the document title on client navigation between top-level routes', async () => {
    const user = userEvent.setup();
    renderShell('/search');

    expect(document.title).toBe('Search - OTCP');
    expect(screen.getByRole('heading', { name: 'Search' })).toBeTruthy();

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    await user.click(within(nav).getByRole('link', { name: 'Formats' }));
    expect(document.title).toBe('Formats - OTCP');

    await user.click(within(nav).getByRole('link', { name: 'Decks' }));
    expect(document.title).toBe('Decks - OTCP');

    await user.click(within(nav).getByRole('link', { name: 'Collection' }));
    expect(document.title).toBe('Collection - OTCP');

    await user.click(within(nav).getByRole('link', { name: 'Lists' }));
    expect(document.title).toBe('Lists - OTCP');

    await user.click(within(nav).getByRole('link', { name: 'About' }));
    expect(document.title).toBe('About - OTCP');

    await user.click(within(nav).getByRole('link', { name: 'Account' }));
    expect(document.title).toBe('Account - OTCP');
  });

  it('uses each card name, including an alternate artwork id that shares that name', async () => {
    const router = renderShell('/search');

    await act(async () => {
      await router.navigate('/search/card/46986420');
    });
    await waitFor(() => {
      expect(document.title).toBe('Dark Magician - OTCP');
    });

    await act(async () => {
      await router.navigate('/search/card/46986421');
    });
    await waitFor(() => {
      expect(document.title).toBe('Dark Magician - OTCP');
    });

    await act(async () => {
      await router.navigate('/search/card/89631139');
    });
    await waitFor(() => {
      expect(document.title).toBe('Blue-Eyes White Dragon - OTCP');
    });
  });

  it('titles a format page from the catalog name and falls back when the format is unknown', async () => {
    const router = renderShell('/formats');
    expect(document.title).toBe('Formats - OTCP');

    await act(async () => {
      await router.navigate('/formats/goat');
    });
    expect(document.title).toBe('GOAT - OTCP');

    await act(async () => {
      await router.navigate('/formats/missing-format');
    });
    expect(document.title).toBe('OTCP');
  });

  it('uses the open deck name and follows a rename without leaving the editor', async () => {
    const draft = createGuestDeckDraft({ name: 'Locals' });
    const router = renderShell(`/decks/edit/${draft.id}`);
    expect(document.title).toBe('Locals - OTCP');

    act(() => {
      updateGuestDeckDraft(draft.id, { name: 'Weekend locals' });
    });
    expect(document.title).toBe('Weekend locals - OTCP');

    await act(async () => {
      await router.navigate('/decks');
    });
    expect(document.title).toBe('Decks - OTCP');
  });

  it('keeps the product title for home and unknown paths', async () => {
    const router = renderShell('/');
    expect(document.title).toBe('OTCP');

    await act(async () => {
      await router.navigate('/does-not-exist');
    });
    expect(document.title).toBe('OTCP');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
  });
});
