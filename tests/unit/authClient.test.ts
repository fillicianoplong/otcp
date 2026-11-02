import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  getCurrentSession,
  onAuthStateChange,
  signIn,
  signOut,
  signUp,
} from '../../src/shared/auth/authClient.ts';

function createMockClient(authMethods: Record<string, unknown>): SupabaseClient {
  return { auth: authMethods } as unknown as SupabaseClient;
}

describe('AuthClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signUp sets emailRedirectTo to the account page URL', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
    vi.stubEnv('BASE_URL', '/otcp/');

    const signUpFn = vi.fn(async () => ({ data: { session: null, user: {} }, error: null }));
    const client = createMockClient({ signUp: signUpFn });

    const result = await signUp('player@example.com', 'secret12', client);

    expect(result).toEqual({ ok: true, needsEmailConfirmation: true });
    expect(signUpFn).toHaveBeenCalledWith({
      email: 'player@example.com',
      password: 'secret12',
      options: {
        emailRedirectTo: 'https://example.com/otcp/account',
      },
    });
  });

  it('signUp returns an error message without throwing', async () => {
    const signUpFn = vi.fn(async () => ({
      data: { session: null, user: null },
      error: { message: 'User already registered' },
    }));
    const client = createMockClient({ signUp: signUpFn });

    const result = await signUp('player@example.com', 'secret12', client);

    expect(result).toEqual({ ok: false, message: 'User already registered' });
  });

  it('signIn returns ok on success', async () => {
    const signInWithPassword = vi.fn(async () => ({
      data: { session: {}, user: {} },
      error: null,
    }));
    const client = createMockClient({ signInWithPassword });

    await expect(signIn('player@example.com', 'secret12', client)).resolves.toEqual({ ok: true });
  });

  it('signOut returns ok on success', async () => {
    const signOutFn = vi.fn(async () => ({ error: null }));
    const client = createMockClient({ signOut: signOutFn });

    await expect(signOut(client)).resolves.toEqual({ ok: true });
  });

  it('getCurrentSession returns session data', async () => {
    const session = { user: { email: 'player@example.com' } };
    const getSession = vi.fn(async () => ({ data: { session }, error: null }));
    const client = createMockClient({ getSession });

    await expect(getCurrentSession(client)).resolves.toEqual({ ok: true, session });
  });

  it('onAuthStateChange forwards session updates', () => {
    const callback = vi.fn();
    let listener: ((event: string, session: unknown) => void) | undefined;
    const onAuthStateChangeFn = vi.fn((cb) => {
      listener = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    const client = createMockClient({ onAuthStateChange: onAuthStateChangeFn });

    onAuthStateChange(callback, client);
    listener?.('SIGNED_IN', { user: { email: 'player@example.com' } });

    expect(callback).toHaveBeenCalledWith({ user: { email: 'player@example.com' } });
  });

  it('returns not available when client is null', async () => {
    await expect(signIn('a@b.com', 'pw', null)).resolves.toEqual({
      ok: false,
      message: 'Accounts are not available on this site yet.',
    });
  });
});
