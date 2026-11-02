import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from '../supabase/client.ts';
import { buildAccountRedirectUrl } from './accountUrl.ts';
import type {
  AuthFailure,
  AuthResult,
  AuthStateCallback,
  AuthStateSubscription,
  SessionResult,
} from './types.ts';

function resolveClient(client?: SupabaseClient | null): SupabaseClient | null {
  if (client !== undefined) {
    return client;
  }
  return getSupabaseClient();
}

function notAvailable(): AuthFailure {
  return { ok: false, message: 'Accounts are not available on this site yet.' };
}

function authErrorMessage(error: { message: string }): string {
  const trimmed = error.message.trim();
  return trimmed.length > 0 ? trimmed : 'Something went wrong. Try again.';
}

export async function signUp(
  email: string,
  password: string,
  clientOverride?: SupabaseClient | null,
): Promise<AuthResult> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return notAvailable();
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: buildAccountRedirectUrl(),
      },
    });
    if (error) {
      return { ok: false, message: authErrorMessage(error) };
    }
    if (!data.session) {
      return { ok: true, needsEmailConfirmation: true };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Something went wrong. Try again.' };
  }
}

export async function signIn(
  email: string,
  password: string,
  clientOverride?: SupabaseClient | null,
): Promise<AuthResult> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return notAvailable();
  }

  try {
    const { error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      return { ok: false, message: authErrorMessage(error) };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Something went wrong. Try again.' };
  }
}

export async function signOut(clientOverride?: SupabaseClient | null): Promise<AuthResult> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return notAvailable();
  }

  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return { ok: false, message: authErrorMessage(error) };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Something went wrong. Try again.' };
  }
}

export async function getCurrentSession(
  clientOverride?: SupabaseClient | null,
): Promise<SessionResult> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return { ok: true, session: null };
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      return { ok: false, message: authErrorMessage(error) };
    }
    return { ok: true, session: data.session };
  } catch {
    return { ok: false, message: 'Something went wrong. Try again.' };
  }
}

export function onAuthStateChange(
  callback: AuthStateCallback,
  clientOverride?: SupabaseClient | null,
): AuthStateSubscription {
  const client = resolveClient(clientOverride);
  if (!client) {
    callback(null);
    return { unsubscribe: () => undefined };
  }

  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return {
    unsubscribe: () => {
      data.subscription.unsubscribe();
    },
  };
}
