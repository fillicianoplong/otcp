/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

import { AuthProvider } from '../shared/auth/authContextState.tsx';
import { AccountPage } from './AccountPage.tsx';

const getSupabaseClient = vi.fn();
const isSupabaseConfigured = vi.fn();

vi.mock('../shared/supabase/client.ts', () => ({
  getSupabaseClient: () => getSupabaseClient(),
  isSupabaseConfigured: () => isSupabaseConfigured(),
}));

const signIn = vi.fn();
const signOut = vi.fn();
const signUp = vi.fn();
const deleteMyAccount = vi.fn();

vi.mock('../shared/auth/authClient.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/auth/authClient.ts')>();
  return {
    ...actual,
    signIn: (...args: Parameters<typeof actual.signIn>) => signIn(...args),
    signOut: (...args: Parameters<typeof actual.signOut>) => signOut(...args),
    signUp: (...args: Parameters<typeof actual.signUp>) => signUp(...args),
    deleteMyAccount: (...args: Parameters<typeof actual.deleteMyAccount>) =>
      deleteMyAccount(...args),
  };
});

let authStateCallback: ((event: string, next: Session | null) => void) | null = null;

function emitAuthSession(next: Session | null) {
  authStateCallback?.('SIGNED_OUT', next);
}

function renderAccountPage(initialEntry = '/account') {
  const router = createMemoryRouter([{ path: '/account', element: <AccountPage /> }], {
    initialEntries: [initialEntry],
    initialIndex: 0,
  });
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
}

function mockAuthClient(session: Session | null) {
  const unsubscribe = vi.fn();
  authStateCallback = null;
  getSupabaseClient.mockReturnValue({
    auth: {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      onAuthStateChange: vi.fn((callback: (event: string, next: Session | null) => void) => {
        authStateCallback = callback;
        callback('INITIAL_SESSION', session);
        return { data: { subscription: { unsubscribe } } };
      }),
    },
    rpc: vi.fn(),
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AccountPage', () => {
  beforeEach(() => {
    signIn.mockReset();
    signOut.mockReset();
    signUp.mockReset();
    deleteMyAccount.mockReset();
    authStateCallback = null;
  });

  it('shows a note when Supabase is not configured', () => {
    isSupabaseConfigured.mockReturnValue(false);
    getSupabaseClient.mockReturnValue(null);

    renderAccountPage();

    expect(screen.getByRole('status').textContent).toMatch(/Accounts are not available/i);
    expect(screen.queryByLabelText('Email')).toBeNull();
  });

  it('shows the sign-in form when signed out', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthClient(null);

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeTruthy();
    });
    expect(screen.getAllByRole('button', { name: 'Sign in' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Create account' }).length).toBeGreaterThan(0);
  });

  it('shows signed-in email and sign out', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthClient({ user: { email: 'player@example.com' } } as Session);

    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByText('Signed in as player@example.com')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
  });

  it('shows sign-up confirmation message after create account', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthClient(null);
    signUp.mockResolvedValue({ ok: true, needsEmailConfirmation: true });

    const user = userEvent.setup();
    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: 'Create account', pressed: false }));
    await user.type(screen.getByLabelText('Email'), 'player@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret12');
    const submit = document.querySelector('button[type="submit"]');
    expect(submit).not.toBeNull();
    await user.click(submit!);

    await waitFor(() => {
      expect(screen.getByText('Check your email to confirm your account.')).toBeTruthy();
    });
  });

  it('deletes the account after typing DELETE in the confirm dialog', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthClient({
      user: { id: 'user-123', email: 'player@example.com' },
    } as Session);
    deleteMyAccount.mockResolvedValue({ ok: true });
    signOut.mockImplementation(async () => {
      emitAuthSession(null);
      return { ok: true };
    });

    const user = userEvent.setup();
    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByText('Signed in as player@example.com')).toBeTruthy();
    });

    await user.click(screen.getAllByRole('button', { name: 'Delete account' })[0]!);
    expect(screen.getByRole('dialog', { name: 'Delete account' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Confirmation'), { target: { value: 'DELETE' } });
    const dialog = screen.getByRole('dialog', { name: 'Delete account' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete account' }));

    await waitFor(() => {
      expect(deleteMyAccount).toHaveBeenCalled();
      expect(signOut).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Your account has been deleted.')).toBeTruthy();
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows an error when account deletion fails', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthClient({
      user: { id: 'user-123', email: 'player@example.com' },
    } as Session);
    deleteMyAccount.mockResolvedValue({ ok: false, message: 'Could not delete your account.' });

    const user = userEvent.setup();
    renderAccountPage();

    await waitFor(() => {
      expect(screen.getByText('Signed in as player@example.com')).toBeTruthy();
    });

    await user.click(screen.getAllByRole('button', { name: 'Delete account' })[0]!);
    fireEvent.change(screen.getByLabelText('Confirmation'), { target: { value: 'DELETE' } });
    const dialog = screen.getByRole('dialog', { name: 'Delete account' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete account' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/Could not delete your account/i);
    });
    expect(signOut).not.toHaveBeenCalled();
    expect(screen.getByText('Signed in as player@example.com')).toBeTruthy();
  });

  it('returns to the deck path when signed in with returnTo', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    mockAuthClient({
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: { id: 'user-1', email: 'player@example.com' } as Session['user'],
    } as Session);

    const returnPath = '/decks?draft=draft-123';
    const router = createMemoryRouter(
      [
        { path: '/account', element: <AccountPage /> },
        { path: '/decks', element: <p>Back on decks</p> },
      ],
      {
        initialEntries: [`/account?returnTo=${encodeURIComponent(returnPath)}`],
        initialIndex: 0,
      },
    );

    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Back on decks')).toBeTruthy();
    });
  });
});
