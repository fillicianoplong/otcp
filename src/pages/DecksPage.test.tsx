/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

import sampleDevDataset from '../../public/data/datasets/sample-dev.json';
import { CardCatalogProvider } from '../catalog/CardCatalogProvider.tsx';
import { clearCardCatalogCache } from '../catalog/loadCatalog.ts';
import { clearDeckCoversStorage } from '../deckStore/deckCoverStore.ts';
import { clearGuestDeckDraftsStorage, createGuestDeckDraft, getGuestDeckDraft } from '../deckStore';
import { OTCP_DATASET_SCHEMA_VERSION_LEGACY } from '../shared/schema/constants.ts';
import { buildDecksDraftReturnPath } from '../shared/auth/accountUrl.ts';
import { AuthProvider } from '../shared/auth/authContextState.tsx';
import { AccountPage } from './AccountPage.tsx';
import { DecksPage } from './DecksPage.tsx';

const getSupabaseClient = vi.fn();
const isSupabaseConfigured = vi.fn();

vi.mock('../shared/supabase/client.ts', () => ({
  getSupabaseClient: () => getSupabaseClient(),
  isSupabaseConfigured: () => isSupabaseConfigured(),
}));

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

function mockAuthClient(session: Session | null, savedRows: unknown[] = []) {
  const unsubscribe = vi.fn();
  const auth = {
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
    onAuthStateChange: vi.fn((callback: (event: string, next: Session | null) => void) => {
      callback('INITIAL_SESSION', session);
      return { data: { subscription: { unsubscribe } } };
    }),
  };
  getSupabaseClient.mockReturnValue({
    auth,
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(async () => ({ data: savedRows, error: null })),
      })),
    })),
  });
}

function renderDecksAt(initialPath = '/decks') {
  return render(
    <AuthProvider>
      <CardCatalogProvider>
        <RouterProvider
          router={createMemoryRouter(
            [
              { path: '/decks', element: <DecksPage /> },
              { path: '/decks/edit/:draftId', element: <h1>Editor</h1> },
              { path: '/account', element: <AccountPage /> },
            ],
            { initialEntries: [initialPath], initialIndex: 0 },
          )}
        />
      </CardCatalogProvider>
    </AuthProvider>,
  );
}

const signedInSession = {
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: { id: 'user-1', email: 'player@example.com' },
} as Session;

beforeEach(() => {
  mockCatalogFetch();
  clearCardCatalogCache();
});

afterEach(() => {
  cleanup();
  clearGuestDeckDraftsStorage();
  clearDeckCoversStorage();
  clearCardCatalogCache();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('DecksPage sign-in gate', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthClient(null);
    createGuestDeckDraft({ name: 'Gate test deck' });
  });

  it('lists guest drafts after reload', () => {
    renderDecksAt('/decks');
    expect(screen.getByRole('heading', { name: 'Gate test deck' })).not.toBeNull();
  });

  it('links Save to Account with a deck return path when signed out', async () => {
    clearGuestDeckDraftsStorage();
    const draft = createGuestDeckDraft({ name: 'Save link deck' });
    renderDecksAt('/decks');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Actions for Save link deck' }));
    const saveLink = screen.getByRole('menuitem', { name: 'Save' });
    const expectedReturn = encodeURIComponent(buildDecksDraftReturnPath(draft.id));
    expect(saveLink.getAttribute('href')).toContain(`/account?returnTo=${expectedReturn}`);

    await user.click(saveLink);

    expect(await screen.findByRole('heading', { level: 1, name: 'Account' })).not.toBeNull();
  });

  it('links Share to the Account page when signed out', async () => {
    renderDecksAt('/decks');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Actions for Gate test deck' }));
    const shareLink = screen.getByRole('menuitem', { name: 'Share' });
    expect(shareLink.getAttribute('href')).toContain('/account?returnTo=');

    await user.click(shareLink);

    expect(await screen.findByRole('heading', { level: 1, name: 'Account' })).not.toBeNull();
  });

  it('enables Save when signed in and keeps Share disabled', async () => {
    mockAuthClient(signedInSession);

    renderDecksAt('/decks');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Actions for Gate test deck' }));

    expect(screen.getByRole('menuitem', { name: 'Save' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('menuitem', { name: 'Share' }).hasAttribute('disabled')).toBe(true);
  });
});

describe('DecksPage card chrome', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthClient(null);
  });

  it('shows the name, format, counts, and draft status without a button row', async () => {
    createGuestDeckDraft({
      name: 'Weekend locals',
      formatId: 'yugi-kaiba',
      main: [89631139, 89631139],
      extra: [46986420],
      side: [],
    });
    renderDecksAt('/decks');

    expect(screen.getByRole('heading', { name: 'Weekend locals' })).not.toBeNull();
    expect(screen.getByText('Yugi-Kaiba')).not.toBeNull();
    expect(screen.getByText('Main 2')).not.toBeNull();
    expect(screen.getByText('Extra 1')).not.toBeNull();
    expect(screen.getByText('Side 0')).not.toBeNull();
    expect(screen.getByText('Local draft')).not.toBeNull();
    expect(screen.getByText(/Updated/)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Open' })).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Actions for Weekend locals' }));
    const menu = screen.getByRole('menu', { name: 'Actions for Weekend locals' });
    expect(within(menu).getAllByRole('menuitem', { name: 'Open' })).toHaveLength(1);
    expect(within(menu).getByRole('menuitem', { name: 'Save' })).not.toBeNull();
    expect(within(menu).getByRole('menuitem', { name: 'Share' })).not.toBeNull();
    expect(within(menu).getByRole('menuitem', { name: 'Rename' })).not.toBeNull();
    expect(within(menu).getByRole('menuitem', { name: 'Remove' })).not.toBeNull();
    expect(within(menu).getByRole('menuitem', { name: 'Choose cover' })).not.toBeNull();
  });

  it('uses a placeholder cover for an empty deck and opens from the card', async () => {
    const draft = createGuestDeckDraft({ name: 'Empty shell', formatId: 'advanced' });
    renderDecksAt('/decks');

    const card = screen.getByRole('article', { name: 'Empty shell' });
    expect(within(card).getByText('No cards')).not.toBeNull();
    expect(within(card).queryByRole('img')).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Actions for Empty shell' }));
    expect(screen.getByRole('menuitem', { name: 'Choose cover' }).hasAttribute('disabled')).toBe(
      true,
    );

    await user.click(screen.getByRole('link', { name: 'Open Empty shell' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Editor' })).not.toBeNull();
    expect(getGuestDeckDraft(draft.id)?.name).toBe('Empty shell');
  });

  it('shows a card cover and keeps a chosen artwork after reload', async () => {
    const draft = createGuestDeckDraft({
      name: 'Art deck',
      formatId: 'advanced',
      main: [89631139, 46986420],
      extra: [],
      side: [],
    });
    renderDecksAt('/decks');

    const initial = await screen.findByRole('img', { name: 'Blue-Eyes White Dragon cover' });
    expect(initial.getAttribute('src')).toContain('89631139');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Actions for Art deck' }));
    await user.click(screen.getByRole('menuitem', { name: 'Choose cover' }));
    const dialog = await screen.findByRole('dialog', { name: 'Choose cover' });
    await user.click(within(dialog).getByRole('button', { name: 'Dark Magician, artwork 2 of 5' }));

    const chosen = await screen.findByRole('img', { name: 'Dark Magician cover' });
    expect(chosen.getAttribute('src')).toContain('46986421');
    expect(getGuestDeckDraft(draft.id)?.cover).toEqual({ cardId: 46986420, artId: 46986421 });

    cleanup();
    renderDecksAt('/decks');
    const restored = await screen.findByRole('img', { name: 'Dark Magician cover' });
    expect(restored.getAttribute('src')).toContain('46986421');
  });

  it('shows a saved deck cover and keeps Open, Share, Rename, and Remove in the menu', async () => {
    mockAuthClient(signedInSession, [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Cloud deck',
        format_id: 'advanced',
        main: [89631139],
        extra: [],
        side: [],
        updated_at: '2026-11-04T12:00:00.000Z',
      },
    ]);
    renderDecksAt('/decks');

    expect(await screen.findByRole('img', { name: 'Blue-Eyes White Dragon cover' })).not.toBeNull();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Actions for Cloud deck' }));
    const menu = screen.getByRole('menu', { name: 'Actions for Cloud deck' });
    expect(within(menu).getByRole('menuitem', { name: 'Open' })).not.toBeNull();
    expect(within(menu).queryByRole('menuitem', { name: 'Save' })).toBeNull();
    expect(within(menu).getByRole('menuitem', { name: 'Share' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(within(menu).getByRole('menuitem', { name: 'Rename' })).not.toBeNull();
    expect(within(menu).getByRole('menuitem', { name: 'Remove' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();
  });
});
