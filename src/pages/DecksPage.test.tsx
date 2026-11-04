/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

import { clearGuestDeckDraftsStorage, createGuestDeckDraft } from '../deckStore';
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

function mockAuthClient(session: Session | null) {
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
        order: vi.fn(async () => ({ data: [], error: null })),
      })),
    })),
  });
}

function renderDecksAt(initialPath = '/decks') {
  return render(
    <AuthProvider>
      <RouterProvider
        router={createMemoryRouter(
          [
            { path: '/decks', element: <DecksPage /> },
            { path: '/account', element: <AccountPage /> },
          ],
          { initialEntries: [initialPath], initialIndex: 0 },
        )}
      />
    </AuthProvider>,
  );
}

afterEach(() => {
  cleanup();
  clearGuestDeckDraftsStorage();
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
    const saveLink = screen.getByRole('link', { name: 'Save' });
    const expectedReturn = encodeURIComponent(buildDecksDraftReturnPath(draft.id));
    expect(saveLink.getAttribute('href')).toContain(`/account?returnTo=${expectedReturn}`);

    const user = userEvent.setup();
    await user.click(saveLink);

    expect(await screen.findByRole('heading', { level: 1, name: 'Account' })).not.toBeNull();
  });

  it('links Share to the Account page when signed out', async () => {
    renderDecksAt('/decks');
    const shareLink = screen.getByRole('link', { name: 'Share' });
    expect(shareLink.getAttribute('href')).toContain('/account?returnTo=');

    const user = userEvent.setup();
    await user.click(shareLink);

    expect(await screen.findByRole('heading', { level: 1, name: 'Account' })).not.toBeNull();
  });

  it('enables Save when signed in and keeps Share disabled', () => {
    mockAuthClient({
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: { id: 'user-1', email: 'player@example.com' } as Session['user'],
    } as Session);

    renderDecksAt('/decks');

    expect(screen.getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('button', { name: 'Share' }).hasAttribute('disabled')).toBe(true);
  });
});
