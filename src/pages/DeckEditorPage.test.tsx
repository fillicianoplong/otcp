/**
 * @vitest-environment jsdom
 */
/// <reference types="@testing-library/jest-dom/vitest" />
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import sampleDevDataset from '../../public/data/datasets/sample-dev.json';
import { CardCatalogProvider } from '../catalog/CardCatalogProvider.tsx';
import { clearCardCatalogCache } from '../catalog/loadCatalog.ts';
import { clearGuestDeckDraftsStorage, createGuestDeckDraft, getGuestDeckDraft } from '../deckStore';
import { CARD_FINDER_VIEW_STORAGE_KEY } from '../cardFinder/cardFinderView.ts';
import { DECK_ZONE_SORT_STORAGE_KEY } from '../deckEditor/deckZoneSort.ts';
import { DECK_ZONE_VIEW_STORAGE_KEY } from '../deckEditor/deckZoneView.ts';
import { DECK_EDITOR_SPLIT_MIN_PX } from '../deckEditor/deckEditorLayout.ts';
import { OTCP_DATASET_SCHEMA_VERSION_LEGACY } from '../shared/schema/constants.ts';
import { DeckEditorPage } from './DeckEditorPage.tsx';

function cardId(name: string): number {
  const card = sampleDevDataset.cards.find((entry) => entry.name === name);
  if (!card) throw new Error(`missing sample card ${name}`);
  return card.id;
}

function mockViewport(desktop: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: desktop && query.includes(String(DECK_EDITOR_SPLIT_MIN_PX)),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

function mockCatalogFetch() {
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

function createTransfer() {
  const data = new Map<string, string>();
  return {
    data,
    effectAllowed: 'copy',
    dropEffect: 'copy',
    setData(type: string, value: string) {
      data.set(type, value);
    },
    getData(type: string) {
      return data.get(type) ?? '';
    },
  };
}

function renderEditor(draftId: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <CardCatalogProvider>
            <Outlet />
          </CardCatalogProvider>
        ),
        children: [
          { path: '/decks/edit/:draftId', element: <DeckEditorPage /> },
          { path: '/decks', element: <h1>My decks</h1> },
        ],
      },
    ],
    { initialEntries: [`/decks/edit/${draftId}`] },
  );
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  mockCatalogFetch();
});

afterEach(() => {
  cleanup();
  clearGuestDeckDraftsStorage();
  clearCardCatalogCache();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('DeckEditorPage', () => {
  it('renames the open deck on the page and keeps the name after reload', async () => {
    mockViewport(true);
    const draft = createGuestDeckDraft({ name: 'Locals', formatId: 'advanced' });
    const user = userEvent.setup();
    renderEditor(draft.id);

    const name = screen.getByRole('textbox', { name: 'Deck name' });
    await user.clear(name);
    await user.type(name, 'Weekend locals');
    await user.tab();

    expect(getGuestDeckDraft(draft.id)?.name).toBe('Weekend locals');
    expect(name).toHaveValue('Weekend locals');
    expect(screen.getByRole('heading', { name: 'Main' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /My decks/ })).toBeNull();

    cleanup();
    renderEditor(draft.id);
    expect(screen.getByRole('textbox', { name: 'Deck name' })).toHaveValue('Weekend locals');
  });

  it('filters the desktop library and drops or adds into the named section', async () => {
    mockViewport(true);
    const draft = createGuestDeckDraft({ name: 'Locals', formatId: 'advanced' });
    const user = userEvent.setup();
    renderEditor(draft.id);

    const results = await screen.findByTestId('card-finder-results');
    expect(within(results).getByText('Blue-Eyes White Dragon')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add cards' })).toBeNull();

    await user.click(screen.getByRole('button', { name: /^Filters/ }));
    const clearFilters = screen.getByRole('button', { name: 'Clear all' });
    expect(clearFilters.parentElement?.className ?? '').not.toMatch(/max-h-|overflow-y/);
    let column: HTMLElement | null = clearFilters;
    while (column) {
      expect(column.className).not.toMatch(/max-h-\[calc\(100dvh|overflow-y-auto/);
      column = column.parentElement;
    }
    await user.click(screen.getByRole('checkbox', { name: 'Include Synchro' }));

    expect(
      within(screen.getByTestId('card-finder-results')).queryByText('Blue-Eyes White Dragon'),
    ).toBeNull();
    expect(
      within(screen.getByTestId('card-finder-results')).getByText('Stardust Dragon'),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search cards' }), 'Stardust');

    const stardustRow = within(screen.getByTestId('card-finder-results')).getByTestId(
      `library-card-${cardId('Stardust Dragon')}`,
    );
    const main = screen.getByTestId('deck-zone-main');
    const refusedTransfer = createTransfer();
    fireEvent.dragStart(stardustRow, { dataTransfer: refusedTransfer });
    fireEvent.dragOver(main, { dataTransfer: refusedTransfer });
    fireEvent.drop(main, { dataTransfer: refusedTransfer });

    expect(screen.getByTestId('deck-editor-message')).toHaveTextContent(/not Main/);
    expect(within(main).queryByText('Stardust Dragon')).toBeNull();
    expect(screen.getByTestId('deck-zone-main-count')).toHaveTextContent(/^0/);
    expect(screen.getByTestId('deck-zone-extra-count')).toHaveTextContent(/^0/);

    await user.click(screen.getByRole('button', { name: 'Add Stardust Dragon' }));
    expect(within(screen.getByTestId('deck-zone-extra')).getByText('Stardust Dragon')).toBeTruthy();
    expect(screen.getByTestId('deck-zone-extra-count')).toHaveTextContent(/^1/);
    expect(within(main).queryByText('Stardust Dragon')).toBeNull();
    expect(getGuestDeckDraft(draft.id)?.extra).toEqual([cardId('Stardust Dragon')]);

    await user.clear(screen.getByRole('searchbox', { name: 'Search cards' }));
    const blueEyesRow = await within(screen.getByTestId('card-finder-results')).findByTestId(
      `library-card-${cardId('Blue-Eyes White Dragon')}`,
    );
    const side = screen.getByTestId('deck-zone-side');
    const sideTransfer = createTransfer();
    fireEvent.dragStart(blueEyesRow, { dataTransfer: sideTransfer });
    fireEvent.drop(side, { dataTransfer: sideTransfer });

    expect(within(side).getByText('Blue-Eyes White Dragon')).toBeTruthy();
    expect(screen.getByTestId('deck-zone-side-count')).toHaveTextContent(/^1/);
    expect(screen.getByTestId('deck-zone-main-count')).toHaveTextContent(/^0/);
    expect(getGuestDeckDraft(draft.id)?.side).toEqual([cardId('Blue-Eyes White Dragon')]);
  });

  it('adds from the phone sheet without a section picker', async () => {
    mockViewport(false);
    const draft = createGuestDeckDraft({ name: 'Phone deck', formatId: 'advanced' });
    const user = userEvent.setup();
    renderEditor(draft.id);

    expect(screen.queryByRole('searchbox', { name: 'Search cards' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Add cards' }));
    expect(screen.getByRole('dialog', { name: 'Add cards' })).toBeTruthy();

    const dialog = screen.getByRole('dialog', { name: 'Add cards' });
    await user.type(within(dialog).getByRole('searchbox', { name: 'Search cards' }), 'Stardust');
    await user.click(within(dialog).getByRole('button', { name: 'Add Stardust Dragon' }));

    expect(within(screen.getByTestId('deck-zone-extra')).getByText('Stardust Dragon')).toBeTruthy();
    expect(screen.getByTestId('deck-zone-main-count')).toHaveTextContent(/^0/);
    expect(getGuestDeckDraft(draft.id)?.extra).toEqual([cardId('Stardust Dragon')]);

    expect(within(dialog).queryByText(/Extra Deck monsters/)).toBeNull();
    expect(within(dialog).queryByRole('radiogroup', { name: 'Add to' })).toBeNull();

    await user.clear(within(dialog).getByRole('searchbox', { name: 'Search cards' }));
    await user.type(
      within(dialog).getByRole('searchbox', { name: 'Search cards' }),
      'Dark Magician',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Add Dark Magician' }));
    expect(within(screen.getByTestId('deck-zone-main')).getByText('Dark Magician')).toBeTruthy();
    expect(screen.getByTestId('deck-zone-main-count')).toHaveTextContent(/^1/);
    expect(getGuestDeckDraft(draft.id)?.main).toEqual([cardId('Dark Magician')]);
  });

  it('reveals add and remove on a tapped phone tile and routes the copy', async () => {
    localStorage.setItem(CARD_FINDER_VIEW_STORAGE_KEY, 'grid');
    localStorage.setItem(DECK_ZONE_VIEW_STORAGE_KEY, 'grid');
    mockViewport(false);
    const stardust = cardId('Stardust Dragon');
    const draft = createGuestDeckDraft({
      name: 'Phone taps',
      formatId: 'advanced',
      extra: [stardust],
    });
    const user = userEvent.setup();
    renderEditor(draft.id);

    const extraTile = await screen.findByTestId('zone-card-extra-0');
    expect(within(extraTile).queryByRole('button')).toBeNull();
    await user.click(extraTile);
    const addExtra = within(extraTile).getByRole('button', {
      name: 'Add Stardust Dragon to Extra',
    });
    expect(addExtra.className).toContain('min-h-touch');
    expect(addExtra.className).toContain('min-w-touch');
    await user.click(addExtra);
    expect(getGuestDeckDraft(draft.id)?.extra).toEqual([stardust, stardust]);
    await user.click(
      within(extraTile).getByRole('button', { name: 'Remove one Stardust Dragon from Extra' }),
    );
    expect(getGuestDeckDraft(draft.id)?.extra).toEqual([stardust]);

    await user.click(screen.getByRole('button', { name: 'Add cards' }));
    const dialog = screen.getByRole('dialog', { name: 'Add cards' });
    await user.click(extraTile);
    const magician = await within(dialog).findByTestId(`library-card-${cardId('Dark Magician')}`);
    await user.click(magician);
    expect(within(extraTile).queryByRole('button')).toBeNull();
    const removeMagician = within(magician).getByRole('button', {
      name: 'Remove one Dark Magician',
    });
    expect(removeMagician).toBeDisabled();
    await user.click(within(magician).getByRole('button', { name: 'Add Dark Magician' }));
    expect(
      getGuestDeckDraft(draft.id)?.extra.filter((id) => id === cardId('Dark Magician')),
    ).toEqual([]);
    expect(screen.getByTestId('deck-editor-message')).toHaveTextContent(/cannot go in the Extra/);

    await user.click(screen.getByRole('heading', { name: 'Main' }));
    expect(within(magician).queryByRole('button')).toBeNull();
    await user.click(magician);
    await user.click(within(magician).getByRole('button', { name: 'Add Dark Magician' }));
    expect(getGuestDeckDraft(draft.id)?.main).toEqual([cardId('Dark Magician')]);
    expect(
      within(magician).getByRole('button', { name: 'Remove one Dark Magician' }),
    ).toBeEnabled();
  });

  it('changes format from Filters and can set it back to Advanced', async () => {
    mockViewport(true);
    const draft = createGuestDeckDraft({ name: 'Locals', formatId: 'yugi-kaiba' });
    const user = userEvent.setup();
    renderEditor(draft.id);

    expect(screen.queryByText(/Extra Deck monsters/)).toBeNull();
    expect(screen.queryByTestId('deck-format-field')).toBeNull();
    expect(document.getElementById('deck-format-select')).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Format' })).toBeNull();
    expect(screen.getByRole('searchbox', { name: 'Search cards' })).toBeTruthy();
    expect(screen.queryByRole('radiogroup', { name: 'Add to' })).toBeNull();
    expect(screen.queryByText(/Main \d+ \/ Extra/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Remove Yugi-Kaiba format/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Filters, 1 active' }).textContent).toBe('1');

    await user.click(screen.getByRole('button', { name: /^Filters/ }));
    const combobox = screen.getByRole('combobox', { name: 'Format' });
    expect((combobox as HTMLInputElement).value).toBe('Yugi-Kaiba');
    expect(screen.queryByRole('button', { name: 'Clear format' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Show formats' })).toBeTruthy();

    await user.click(combobox);
    expect(screen.queryByRole('option', { name: 'All formats' })).toBeNull();
    await user.keyboard('advanced');
    await user.keyboard('{Enter}');

    expect(getGuestDeckDraft(draft.id)?.formatId).toBe('advanced');
    expect(screen.queryByRole('button', { name: /Remove Advanced format/ })).toBeNull();

    await user.click(screen.getByRole('combobox', { name: 'Format' }));
    await user.keyboard('edison');
    await user.keyboard('{Enter}');

    expect(getGuestDeckDraft(draft.id)?.formatId).toBe('edison');
    expect((screen.getByRole('combobox', { name: 'Format' }) as HTMLInputElement).value).toBe(
      'Edison',
    );
    expect(screen.queryByRole('button', { name: /Remove Edison format/ })).toBeNull();

    cleanup();
    clearGuestDeckDraftsStorage();
    const genesys = createGuestDeckDraft({
      name: 'Points',
      formatId: 'genesys',
      genesysCap: 80,
    });
    renderEditor(genesys.id);
    await user.click(screen.getByRole('button', { name: /^Filters/ }));
    await user.click(screen.getByRole('combobox', { name: 'Format' }));
    await user.keyboard('advanced');
    await user.keyboard('{Enter}');
    expect(getGuestDeckDraft(genesys.id)?.formatId).toBe('advanced');
    expect(getGuestDeckDraft(genesys.id)?.genesysCap).toBeUndefined();
  });

  it('applies a format chosen in the phone Filters sheet', async () => {
    mockViewport(false);
    const draft = createGuestDeckDraft({ name: 'Phone deck', formatId: 'yugi-kaiba' });
    const user = userEvent.setup();
    renderEditor(draft.id);

    expect(screen.queryByRole('combobox', { name: 'Format' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Remove Yugi-Kaiba format/ })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Add cards' }));
    const library = screen.getByRole('dialog', { name: 'Add cards' });
    expect(within(library).queryByRole('combobox', { name: 'Format' })).toBeNull();
    expect(within(library).queryByRole('button', { name: /Remove Yugi-Kaiba format/ })).toBeNull();
    expect(within(library).getByRole('button', { name: 'Filters, 1 active' }).textContent).toBe(
      '1',
    );

    await user.click(within(library).getByRole('button', { name: 'Filters, 1 active' }));
    const filters = screen.getByRole('dialog', { name: 'Filters' });
    const combobox = within(filters).getByRole('combobox', { name: 'Format' });
    expect((combobox as HTMLInputElement).value).toBe('Yugi-Kaiba');
    await user.click(combobox);
    expect(within(filters).queryByRole('option', { name: 'All formats' })).toBeNull();
    await user.keyboard('edison');
    await user.keyboard('{Enter}');
    expect(getGuestDeckDraft(draft.id)?.formatId).toBe('yugi-kaiba');

    await user.click(within(filters).getByRole('button', { name: /^See \d/ }));
    expect(getGuestDeckDraft(draft.id)?.formatId).toBe('edison');
    expect(within(library).queryByRole('button', { name: /Remove Edison format/ })).toBeNull();
    expect(within(library).getByRole('button', { name: 'Filters, 1 active' }).textContent).toBe(
      '1',
    );
    expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull();
  });

  it('toggles the library between list rows and a four-column grid and keeps the choice', async () => {
    localStorage.removeItem(CARD_FINDER_VIEW_STORAGE_KEY);
    mockViewport(true);
    const draft = createGuestDeckDraft({ name: 'Locals', formatId: 'advanced' });
    const user = userEvent.setup();
    renderEditor(draft.id);

    const results = await screen.findByTestId('card-finder-results');
    expect(results.className).toContain('flex-col');
    expect(results.getAttribute('data-view')).toBe('list');
    const blueEyes = within(results).getByTestId(
      `library-card-${cardId('Blue-Eyes White Dragon')}`,
    );
    expect(within(blueEyes).getByText('LIGHT, Normal, Dragon')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^Filters/ }).className).toContain('h-control');
    expect(screen.getByRole('button', { name: /^Filters/ }).className).toContain('text-sm');
    expect(screen.getByRole('button', { name: 'Grid view' }).className).toContain('h-control');
    expect(screen.getByRole('button', { name: 'Grid view' }).className).toContain('text-sm');
    expect(screen.queryByText('Remove', { selector: '[data-drop="trash"]' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Grid view' }));

    const grid = screen.getByTestId('card-finder-results');
    expect(grid.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    expect(grid.getAttribute('data-columns')).toBe('4');
    expect(grid.getAttribute('data-view')).toBe('grid');
    const tile = within(grid).getByTestId(`library-card-${cardId('Blue-Eyes White Dragon')}`);
    expect(within(tile).queryByRole('button')).toBeNull();
    tile.focus();
    await user.keyboard('{Enter}');
    expect(
      within(screen.getByTestId('deck-zone-main')).getByText('Blue-Eyes White Dragon'),
    ).toBeTruthy();
    const stardust = within(grid).getByTestId(`library-card-${cardId('Stardust Dragon')}`);
    stardust.focus();
    await user.keyboard('{Enter}');
    expect(within(screen.getByTestId('deck-zone-extra')).getByText('Stardust Dragon')).toBeTruthy();
    expect(screen.queryByRole('radiogroup', { name: 'Add to' })).toBeNull();
    await user.click(tile);
    expect(within(tile).queryByRole('button')).toBeNull();
    expect(localStorage.getItem(CARD_FINDER_VIEW_STORAGE_KEY)).toBe('grid');

    cleanup();
    renderEditor(draft.id);
    const restored = await screen.findByTestId('card-finder-results');
    expect(restored.getAttribute('data-view')).toBe('grid');
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const restoredUser = userEvent.setup();
    await restoredUser.click(screen.getByRole('button', { name: 'List view' }));
    const list = screen.getByTestId('card-finder-results');
    expect(list.className).toContain('flex-col');
    expect(within(list).getByText('LIGHT, Normal, Dragon')).toBeTruthy();
    expect(within(list).getByRole('group', { name: /Copies of Blue-Eyes/ }).className).toContain(
      'ml-auto',
    );
    expect(localStorage.getItem(CARD_FINDER_VIEW_STORAGE_KEY)).toBe('list');
  });

  it('shows each deck copy as its own tile, sorted by type, and removes one from the corner', async () => {
    localStorage.removeItem(DECK_ZONE_VIEW_STORAGE_KEY);
    localStorage.removeItem(DECK_ZONE_SORT_STORAGE_KEY);
    mockViewport(true);
    const blueEyes = cardId('Blue-Eyes White Dragon');
    const darkMagician = cardId('Dark Magician');
    const reborn = cardId('Monster Reborn');
    const mirror = cardId('Mirror Force');
    const draft = createGuestDeckDraft({
      name: 'Locals',
      formatId: 'advanced',
      main: [mirror, darkMagician, blueEyes, blueEyes, reborn],
    });
    const user = userEvent.setup();
    renderEditor(draft.id);

    const main = await screen.findByTestId('deck-zone-main');
    await within(main).findAllByLabelText(
      'Blue-Eyes White Dragon in Main. Delete removes it. M, E, or S moves it.',
    );
    const grid = main.querySelector('ul');
    expect(grid?.style.gridTemplateColumns).toContain('repeat(10');
    expect(grid?.getAttribute('data-view')).toBe('grid');
    expect(
      within(main).queryByRole('button', { name: 'Add Blue-Eyes White Dragon to Main' }),
    ).toBeNull();
    expect(within(main).queryByText('1')).toBeNull();

    const tileName = (tile: Element) =>
      tile.querySelector('[data-card-name]')?.getAttribute('data-card-name') ?? '';
    const tiles = [...(grid?.querySelectorAll(':scope > li') ?? [])];
    expect(tiles.map(tileName)).toEqual([
      'Blue-Eyes White Dragon',
      'Blue-Eyes White Dragon',
      'Dark Magician',
      'Monster Reborn',
      'Mirror Force',
    ]);

    const copies = within(main).getAllByLabelText(
      'Blue-Eyes White Dragon in Main. Delete removes it. M, E, or S moves it.',
    );
    expect(copies).toHaveLength(2);
    copies[0]!.focus();
    await user.keyboard('{Delete}');
    expect(
      within(main).getAllByLabelText(
        'Blue-Eyes White Dragon in Main. Delete removes it. M, E, or S moves it.',
      ),
    ).toHaveLength(1);
    expect(getGuestDeckDraft(draft.id)?.main.filter((id) => id === blueEyes)).toEqual([blueEyes]);

    await user.click(screen.getByRole('button', { name: /^Type$/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Added' }));
    expect(localStorage.getItem(DECK_ZONE_SORT_STORAGE_KEY)).toBe('added');
    const addedOrder = [...(main.querySelector('ul')?.querySelectorAll(':scope > li') ?? [])].map(
      tileName,
    );
    expect(addedOrder[0]).toBe('Mirror Force');

    await user.click(screen.getByRole('button', { name: 'Deck list view' }));
    expect(main.querySelector('ul')?.className).toContain('flex-col');
    expect(within(main).getByText('LIGHT, Normal, Dragon')).toBeTruthy();
    expect(
      within(main).getByRole('button', { name: 'Add Blue-Eyes White Dragon to Main' }),
    ).toBeEnabled();
    expect(localStorage.getItem(DECK_ZONE_VIEW_STORAGE_KEY)).toBe('list');
  });
});
