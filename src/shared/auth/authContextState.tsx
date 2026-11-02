import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { getCurrentSession, onAuthStateChange } from './authClient.ts';
import { isSupabaseConfigured } from '../supabase/client.ts';

export type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  userEmail: string | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      return;
    }

    let active = true;

    void getCurrentSession().then((result) => {
      if (!active) {
        return;
      }
      if (result.ok) {
        setSession(result.session);
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    const subscription = onAuthStateChange((nextSession) => {
      if (!active) {
        return;
      }
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      userEmail: session?.user?.email ?? null,
    }),
    [configured, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
