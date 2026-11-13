import { afterEach, describe, expect, it, vi } from 'vitest';

describe('supabase client helper', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reports not configured when env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const mod = await import('../../src/shared/supabase/client.ts');

    expect(mod.isSupabaseConfigured()).toBe(false);
    expect(mod.getSupabaseConfig()).toEqual({ configured: false });
    expect(mod.getSupabaseClient()).toBeNull();
  });

  it('reports not configured when only one env var is set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const mod = await import('../../src/shared/supabase/client.ts');

    expect(mod.isSupabaseConfigured()).toBe(false);
    expect(mod.getSupabaseClient()).toBeNull();
  });
});
