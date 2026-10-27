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
    expect(screen.getByRole('link', { name: /My decks/ })).toBeTruthy();

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

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('checkbox', { name: 'Include Synchro' }));

    expect(
      within(screen.getByTestId('card-finder-results')).queryByText('Blue-Eyes White Dragon'),
    ).toBeNull();
    expect(
      within(screen.getByTestId('card-finder-results')).getByText('Stardust Dragon'),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
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

  it('adds into a named section from the phone sheet without drag', async () => {
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
    expect(within(dialog).queryByText(/Side needs Side/)).toBeNull();
    const addTo = within(dialog).getByRole('radiogroup', { name: 'Add to' });
    expect(addTo.className).toContain('inline-flex');
    for (const name of ['Auto', 'Main', 'Extra', 'Side']) {
      const radio = within(addTo).getByRole('radio', { name });
      expect(radio.className).toContain('min-h-8');
      expect(radio.className).not.toContain('touch-min');
    }

    await user.clear(within(dialog).getByRole('searchbox', { name: 'Search cards' }));
    await user.type(
      within(dialog).getByRole('searchbox', { name: 'Search cards' }),
      'Dark Magician',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Add Dark Magician' }));
    expect(within(screen.getByTestId('deck-zone-main')).getByText('Dark Magician')).toBeTruthy();
    expect(screen.getByTestId('deck-zone-main-count')).toHaveTextContent(/^1/);
    expect(getGuestDeckDraft(draft.id)?.main).toEqual([cardId('Dark Magician')]);

    await user.click(within(dialog).getByRole('radio', { name: 'Side' }));
    await user.clear(within(dialog).getByRole('searchbox', { name: 'Search cards' }));
    await user.type(
      within(dialog).getByRole('searchbox', { name: 'Search cards' }),
      'Polymerization',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Add Polymerization' }));

    expect(within(screen.getByTestId('deck-zone-side')).getByText('Polymerization')).toBeTruthy();
    expect(within(screen.getByTestId('deck-zone-main')).queryByText('Polymerization')).toBeNull();
    expect(screen.getByTestId('deck-zone-main-count')).toHaveTextContent(/^1/);
    expect(getGuestDeckDraft(draft.id)?.side).toEqual([cardId('Polymerization')]);
  });

  it('picks a format from a short combobox and clears it from the chip', async () => {
    mockViewport(true);
    const draft = createGuestDeckDraft({ name: 'Locals', formatId: 'yugi-kaiba' });
    const user = userEvent.setup();
    renderEditor(draft.id);

    expect(screen.queryByText(/Extra Deck monsters/)).toBeNull();
    const field = screen.getByTestId('deck-format-field');
    expect(field.className).not.toContain('p-4');
    expect(field.querySelector('.w-56')).toBeTruthy();
    expect(document.getElementById('deck-format-select')).toBeNull();

    const combobox = screen.getByRole('combobox', { name: 'Format' });
    expect((combobox as HTMLInputElement).value).toBe('Yugi-Kaiba');
    expect(screen.queryByRole('button', { name: 'Clear format' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Show formats' })).toBeTruthy();

    const chip = screen.getByRole('button', { name: /Remove Yugi-Kaiba format/ });
    expect(chip.className).toContain('rounded-full');
    await user.click(within(chip).getByText('×'));

    expect(getGuestDeckDraft(draft.id)?.formatId).toBe('advanced');
    expect((screen.getByRole('combobox', { name: 'Format' }) as HTMLInputElement).value).toBe(
      'Advanced',
    );
    expect(screen.queryByRole('button', { name: /Remove Yugi-Kaiba format/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Remove Advanced format/ })).toBeTruthy();

    await user.click(screen.getByRole('combobox', { name: 'Format' }));
    await user.keyboard('edison');
    await user.keyboard('{Enter}');

    expect(getGuestDeckDraft(draft.id)?.formatId).toBe('edison');
    expect((screen.getByRole('combobox', { name: 'Format' }) as HTMLInputElement).value).toBe(
      'Edison',
    );
    expect(screen.getByRole('button', { name: /Remove Edison format/ })).toBeTruthy();

    cleanup();
    clearGuestDeckDraftsStorage();
    const genesys = createGuestDeckDraft({
      name: 'Points',
      formatId: 'genesys',
      genesysCap: 80,
    });
    renderEditor(genesys.id);
    await user.click(
      within(screen.getByRole('button', { name: /Remove Genesys format/ })).getByText('×'),
    );
    expect(getGuestDeckDraft(genesys.id)?.formatId).toBe('advanced');
    expect(getGuestDeckDraft(genesys.id)?.genesysCap).toBeUndefined();
  });
});
