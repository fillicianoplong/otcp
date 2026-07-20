/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CATALOG_VIEW_STORAGE_KEY_SEARCH,
  writeCatalogViewPreference,
} from '../../src/catalog/catalogViewMode.ts';
import {
  CATALOG_TABLE_PREFS_STORAGE_KEY_SEARCH,
  writeSearchTablePrefsToLocalStorage,
} from '../../src/catalog/catalogTablePrefsStorage.ts';
import {
  buildProfilePatchFromLocalStorage,
  clearProfilePreferenceSyncTimer,
  configureProfilePreferenceSync,
  flushProfilePreferenceSync,
  loadAndApplyProfilePreferences,
  mergeProfilePreferencesOnSignIn,
  scheduleProfilePreferenceSync,
  updateProfilePreferences,
} from '../../src/shared/profile/profileViewPreferences.ts';

function createMockClient(handlers: {
  selectResult?: { data: unknown; error: unknown };
  updateResult?: { error: unknown };
  updateSpy?: () => Promise<{ error: unknown }>;
}): SupabaseClient {
  const runUpdate =
    handlers.updateSpy ?? (async () => ({ error: handlers.updateResult?.error ?? null }));
  const maybeSingle = vi.fn(async () => ({
    data: handlers.selectResult?.data ?? null,
    error: handlers.selectResult?.error ?? null,
  }));
  const eqAfterSelect = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq: eqAfterSelect }));
  const eqAfterUpdate = vi.fn(() => runUpdate());
  const update = vi.fn(() => ({ eq: eqAfterUpdate }));

  return {
    from: vi.fn(() => ({ select, update })),
  } as unknown as SupabaseClient;
}

describe('profileViewPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
    configureProfilePreferenceSync({ userId: null, onApplied: vi.fn() });
    clearProfilePreferenceSyncTimer();
  });

  afterEach(() => {
    clearProfilePreferenceSyncTimer();
    vi.useRealTimers();
  });

  it('mergeProfilePreferencesOnSignIn prefers server card view over local', () => {
    const merged = mergeProfilePreferencesOnSignIn({
      localCardView: 'list',
      localSearchTable: null,
      profile: { card_view_pref: 'grid', table_column_prefs: null },
    });

    expect(merged.cardViewToApply).toBe('grid');
    expect(merged.seedPatch).toEqual({});
  });

  it('mergeProfilePreferencesOnSignIn seeds profile from local when server is null', () => {
    writeCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH, 'table');
    writeSearchTablePrefsToLocalStorage({
      visibility: {
        cardType: true,
        attribute: true,
        type: true,
        level: true,
        atk: true,
        def: true,
        archetype: true,
        price: false,
      },
      sort: { column: 'name', direction: 'asc' },
    });

    const merged = mergeProfilePreferencesOnSignIn({
      localCardView: 'table',
      localSearchTable: {
        visibility: {
          cardType: true,
          attribute: true,
          type: true,
          level: true,
          atk: true,
          def: true,
          archetype: true,
          price: false,
        },
        sort: { column: 'name', direction: 'asc' },
      },
      profile: { card_view_pref: null, table_column_prefs: null },
    });

    expect(merged.cardViewToApply).toBeNull();
    expect(merged.tablePrefsToApply).toBeNull();
    expect(merged.seedPatch.card_view_pref).toBe('table');
    expect(merged.seedPatch.table_column_prefs?.search?.sort.column).toBe('name');
  });

  it('scheduleProfilePreferenceSync is a no-op for guests', async () => {
    vi.useFakeTimers();
    writeCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH, 'grid');
    configureProfilePreferenceSync({ userId: null, onApplied: vi.fn() });

    scheduleProfilePreferenceSync();
    vi.advanceTimersByTime(500);

    expect(buildProfilePatchFromLocalStorage().card_view_pref).toBe('grid');
  });

  it('loadAndApplyProfilePreferences writes server prefs to localStorage', async () => {
    const onApplied = vi.fn();
    const client = createMockClient({
      selectResult: {
        data: { card_view_pref: 'list', table_column_prefs: null },
        error: null,
      },
    });

    configureProfilePreferenceSync({
      userId: 'user-1',
      onApplied,
      client,
    });

    await loadAndApplyProfilePreferences('user-1');

    expect(localStorage.getItem(CATALOG_VIEW_STORAGE_KEY_SEARCH)).toBe('list');
    expect(onApplied).toHaveBeenCalledTimes(1);
  });

  it('loadAndApplyProfilePreferences seeds the profile from local values', async () => {
    writeCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH, 'grid');
    const updateSpy = vi.fn(async () => ({ error: null }));
    const client = createMockClient({
      selectResult: {
        data: { card_view_pref: null, table_column_prefs: null },
        error: null,
      },
      updateSpy,
    });

    configureProfilePreferenceSync({
      userId: 'user-1',
      onApplied: vi.fn(),
      client,
    });

    await loadAndApplyProfilePreferences('user-1');

    expect(updateSpy).toHaveBeenCalled();
  });

  it('flushProfilePreferenceSync ignores failed writes without throwing', async () => {
    const client = createMockClient({
      updateResult: { error: { message: 'network' } },
    });

    configureProfilePreferenceSync({
      userId: 'user-1',
      onApplied: vi.fn(),
      client,
    });
    writeCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH, 'grid');

    await expect(flushProfilePreferenceSync()).resolves.toBeUndefined();
  });

  it('debounced write-back sends local card and table prefs', async () => {
    vi.useFakeTimers();
    const updateSpy = vi.fn(async () => ({ error: null }));
    const client = createMockClient({ updateSpy });

    configureProfilePreferenceSync({
      userId: 'user-1',
      onApplied: vi.fn(),
      client,
    });

    writeCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH, 'table');
    writeSearchTablePrefsToLocalStorage({
      visibility: {
        cardType: false,
        attribute: true,
        type: true,
        level: true,
        atk: true,
        def: true,
        archetype: false,
        price: false,
      },
      sort: { column: 'atk', direction: 'desc' },
    });

    scheduleProfilePreferenceSync();
    vi.advanceTimersByTime(450);
    await Promise.resolve();

    expect(updateSpy).toHaveBeenCalled();
    const patch = buildProfilePatchFromLocalStorage();
    expect(patch.card_view_pref).toBe('table');
    expect(patch.table_column_prefs?.search?.sort).toEqual({ column: 'atk', direction: 'desc' });
    expect(localStorage.getItem(CATALOG_TABLE_PREFS_STORAGE_KEY_SEARCH)).toContain('atk');
  });

  it('updateProfilePreferences returns ok false on error', async () => {
    const client = createMockClient({
      updateResult: { error: { message: 'denied' } },
    });

    await expect(
      updateProfilePreferences('user-1', { card_view_pref: 'grid' }, client),
    ).resolves.toEqual({ ok: false });
  });
});
