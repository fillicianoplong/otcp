/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider, type InitialEntry } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import sampleDevDataset from '../../public/data/datasets/sample-dev.json';
import { OTCP_DATASET_SCHEMA_VERSION_LEGACY } from '../shared/schema/constants.ts';
import { CardCatalogProvider } from '../catalog/CardCatalogProvider.tsx';
import { CATALOG_GRID_PAGE_SIZE } from '../catalog/gridPaging.ts';
import { clearCardCatalogCache } from '../catalog/loadCatalog.ts';
import { SEARCH_SCROLL_STATE_KEY } from '../catalog/searchScrollRestore.ts';
import { FORMAT_STORAGE_KEY } from '../format/formatPreference.ts';
import { CardDetailPage } from './CardDetailPage.tsx';
import { SearchPage } from './SearchPage.tsx';

function buildManyCardDataset(count: number) {
  const template = sampleDevDataset.cards[0]!;
  const cards = Array.from({ length: count }, (_, index) => ({
    ...template,
    id: 900_000 + index,
    name: `Sample Card ${index}`,
    passcode: 900_000 + index,
    images: {
      small: `/otcp/card-images/small/${900_000 + index}.jpg`,
      large: `/otcp/card-images/${900_000 + index}.jpg`,
    },
  }));
  return { ...sampleDevDataset, cards };
}

function mockCatalogFetch(dataset: ReturnType<typeof buildManyCardDataset>): void {
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
            cardCount: dataset.cards.length,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('data/datasets/sample-dev.json')) {
        return new Response(JSON.stringify(dataset), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    }),
  );
}

function renderSearchFlowWithRouter(initialEntries: InitialEntry[], initialIndex: number) {
  const dataset = buildManyCardDataset(CATALOG_GRID_PAGE_SIZE + 5);
  mockCatalogFetch(dataset);

  const router = createMemoryRouter(
    [
      {
        element: (
          <CardCatalogProvider>
            <Outlet />
          </CardCatalogProvider>
        ),
        children: [
          { path: '/search', element: <SearchPage /> },
          { path: '/search/card/:id', element: <CardDetailPage /> },
        ],
      },
    ],
    { initialEntries, initialIndex },
  );

  render(<RouterProvider router={router} />);
  return router;
}

afterEach(() => {
  cleanup();
  clearCardCatalogCache();
  localStorage.clear();
  vi.unstubAllGlobals();
});

function stubIntersectionObserver(): void {
  class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
      void _callback;
      void _options;
    }
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
}

describe('Search scroll restore', () => {
  beforeEach(() => {
    let scrollY = 0;
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => scrollY,
    });
    window.scrollTo = ((_x, y) => {
      scrollY = y;
    }) as typeof window.scrollTo;

    stubIntersectionObserver();
  });

  it('restores loaded results and scroll position from saved history state', async () => {
    renderSearchFlowWithRouter(
      [
        {
          pathname: '/search',
          state: {
            [SEARCH_SCROLL_STATE_KEY]: {
              loadedCount: CATALOG_GRID_PAGE_SIZE + 5,
              scrollY: 800,
              query: '',
            },
          },
        },
      ],
      0,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Sample Card 50' })).toBeTruthy();
    });
    expect(window.scrollY).toBe(800);
  });

  it('starts at the top when the search query changes', async () => {
    const user = userEvent.setup();
    renderSearchFlowWithRouter(['/search'], 0);

    await screen.findByText(`${CATALOG_GRID_PAGE_SIZE + 5} cards`);
    window.scrollTo(0, 500);
    await user.type(screen.getByLabelText('Find a card'), '900001');

    await waitFor(() => {
      expect(screen.getByText('1 card')).toBeTruthy();
    });
    await waitFor(() => {
      expect(window.scrollY).toBe(0);
    });
    expect(within(document.body).queryByRole('link', { name: 'Sample Card 50' })).toBeNull();
  });
});

describe('Search format chip', () => {
  beforeEach(() => {
    stubIntersectionObserver();
  });

  it('clears a stored format when the URL has no format param', async () => {
    const user = userEvent.setup();
    localStorage.setItem(FORMAT_STORAGE_KEY, 'yugi-kaiba');
    const router = renderSearchFlowWithRouter(['/search'], 0);

    const chip = await screen.findByRole('button', { name: /Remove Yugi-Kaiba format/ });
    const sidebar = screen.getByRole('complementary', { name: 'Filter sidebar' });
    const combobox = within(sidebar).getByRole('combobox', { name: 'Format' });
    expect(screen.getAllByRole('combobox', { name: 'Format' })).toEqual([combobox]);
    expect((combobox as HTMLInputElement).value).toBe('Yugi-Kaiba');
    expect(screen.queryByRole('button', { name: 'Clear format' })).toBeNull();

    await user.click(within(chip).getByText('×'));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Remove Yugi-Kaiba format/ })).toBeNull();
    });
    expect((screen.getByRole('combobox', { name: 'Format' }) as HTMLInputElement).value).toBe(
      'All formats',
    );
    expect(localStorage.getItem(FORMAT_STORAGE_KEY)).toBeNull();
    expect(router.state.location.search).not.toContain('format=');
  });

  it('clears a format that is selected in the URL', async () => {
    const user = userEvent.setup();
    localStorage.setItem(FORMAT_STORAGE_KEY, 'yugi-kaiba');
    const router = renderSearchFlowWithRouter(['/search?format=yugi-kaiba'], 0);

    const chip = await screen.findByRole('button', { name: /Remove Yugi-Kaiba format/ });
    expect(
      ((await screen.findByRole('combobox', { name: 'Format' })) as HTMLInputElement).value,
    ).toBe('Yugi-Kaiba');
    expect(screen.queryByRole('button', { name: 'Clear format' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Show formats' })).toBeTruthy();

    await user.click(within(chip).getByText('×'));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Remove Yugi-Kaiba format/ })).toBeNull();
    });
    expect((screen.getByRole('combobox', { name: 'Format' }) as HTMLInputElement).value).toBe(
      'All formats',
    );
    expect(localStorage.getItem(FORMAT_STORAGE_KEY)).toBeNull();
    expect(router.state.location.search).not.toContain('format=');
  });
});
