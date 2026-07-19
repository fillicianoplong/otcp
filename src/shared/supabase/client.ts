import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SupabaseConfig =
  { configured: false } | { configured: true; url: string; anonKey: string };

let cachedClient: SupabaseClient | undefined;

/** True when both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().configured;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return { configured: false };
  }
  return { configured: true, url, anonKey };
}

/** Lazily created client, or null when Supabase env vars are missing. */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.configured) {
    return null;
  }
  if (cachedClient === undefined) {
    cachedClient = createClient(config.url, config.anonKey);
  }
  return cachedClient;
}
