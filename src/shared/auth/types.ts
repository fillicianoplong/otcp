import type { Session } from '@supabase/supabase-js';

export type AuthSuccess = { ok: true; needsEmailConfirmation?: boolean };
export type AuthFailure = { ok: false; message: string };
export type AuthResult = AuthSuccess | AuthFailure;

export type SessionResult = { ok: true; session: Session | null } | { ok: false; message: string };

export type AuthStateCallback = (session: Session | null) => void;

export type AuthStateSubscription = {
  unsubscribe: () => void;
};
