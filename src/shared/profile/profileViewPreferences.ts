import {
  CATALOG_VIEW_STORAGE_KEY_SEARCH,
  isCatalogViewMode,
  readCatalogViewPreference,
  type CatalogViewMode,
  writeCatalogViewPreference,
} from '../../catalog/catalogViewMode.ts';
import {
  defaultSearchTablePrefsSnapshot,
  parseSearchTablePrefsSnapshot,
  readSearchTablePrefsFromLocalStorage,
  type SearchTablePrefsSnapshot,
  writeSearchTablePrefsToLocalStorage,
} from '../../catalog/catalogTablePrefsStorage.ts';
import { getSupabaseClient } from '../supabase/client.ts';

export const PROFILE_PREFERENCE_SYNC_DEBOUNCE_MS = 400;

export type ProfileTableColumnPrefs = {
  search?: SearchTablePrefsSnapshot;
};

export type ProfilePreferenceRow = {
  card_view_pref: CatalogViewMode | null;
  table_column_prefs: ProfileTableColumnPrefs | null;
};

export type ProfilePreferenceMergeResult = {
  cardViewToApply: CatalogViewMode | null;
  tablePrefsToApply: SearchTablePrefsSnapshot | null;
  seedPatch: Partial<ProfilePreferenceRow>;
};

function parseProfileTableColumnPrefs(raw: unknown): ProfileTableColumnPrefs | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const search = parseSearchTablePrefsSnapshot(record.search);
  if (record.search !== undefined && search === null) {
    return null;
  }
  return search ? { search } : {};
}

export function readLocalCardViewPreference(): CatalogViewMode | null {
  const raw = readCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH);
  if (raw === null || !isCatalogViewMode(raw)) {
    return null;
  }
  return raw;
}

export function applyLocalCardViewPreference(mode: CatalogViewMode): void {
  writeCatalogViewPreference(CATALOG_VIEW_STORAGE_KEY_SEARCH, mode);
}

export function readLocalSearchTablePrefs(): SearchTablePrefsSnapshot | null {
  return readSearchTablePrefsFromLocalStorage();
}

export function applyLocalSearchTablePrefs(snapshot: SearchTablePrefsSnapshot): void {
  writeSearchTablePrefsToLocalStorage(snapshot);
}

/** Server wins when set; otherwise local values seed the profile on sign-in. */
export function mergeProfilePreferencesOnSignIn(options: {
  localCardView: CatalogViewMode | null;
  localSearchTable: SearchTablePrefsSnapshot | null;
  profile: ProfilePreferenceRow | null;
}): ProfilePreferenceMergeResult {
  const { localCardView, localSearchTable, profile } = options;
  const seedPatch: Partial<ProfilePreferenceRow> = {};

  let cardViewToApply: CatalogViewMode | null = null;
  const serverCardView = profile?.card_view_pref ?? null;
  if (serverCardView !== null) {
    cardViewToApply = serverCardView;
  } else if (localCardView !== null) {
    seedPatch.card_view_pref = localCardView;
  }

  let tablePrefsToApply: SearchTablePrefsSnapshot | null = null;
  const serverSearchTable = profile?.table_column_prefs?.search ?? null;
  if (serverSearchTable !== null) {
    tablePrefsToApply = serverSearchTable;
  } else if (localSearchTable !== null) {
    seedPatch.table_column_prefs = { search: localSearchTable };
  }

  return { cardViewToApply, tablePrefsToApply, seedPatch };
}

export function buildProfilePatchFromLocalStorage(): Partial<ProfilePreferenceRow> {
  const patch: Partial<ProfilePreferenceRow> = {};
  const cardView = readLocalCardViewPreference();
  if (cardView !== null) {
    patch.card_view_pref = cardView;
  }
  const table = readLocalSearchTablePrefs();
  if (table !== null) {
    patch.table_column_prefs = { search: table };
  }
  return patch;
}

export function parseProfilePreferenceRow(raw: {
  card_view_pref?: string | null;
  table_column_prefs?: unknown;
}): ProfilePreferenceRow | null {
  const cardRaw = raw.card_view_pref;
  let card_view_pref: CatalogViewMode | null = null;
  if (cardRaw !== null && cardRaw !== undefined) {
    if (!isCatalogViewMode(cardRaw)) {
      return null;
    }
    card_view_pref = cardRaw;
  }

  const table_column_prefs =
    raw.table_column_prefs === null || raw.table_column_prefs === undefined
      ? null
      : parseProfileTableColumnPrefs(raw.table_column_prefs);

  if (
    raw.table_column_prefs !== null &&
    raw.table_column_prefs !== undefined &&
    table_column_prefs === null
  ) {
    return null;
  }

  return { card_view_pref, table_column_prefs };
}

export async function fetchProfilePreferences(
  userId: string,
  clientOverride?: ReturnType<typeof getSupabaseClient>,
): Promise<{ ok: true; profile: ProfilePreferenceRow | null } | { ok: false }> {
  const client = clientOverride ?? getSupabaseClient();
  if (!client) {
    return { ok: false };
  }

  const { data, error } = await client
    .from('profiles')
    .select('card_view_pref, table_column_prefs')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false };
  }

  const parsed = parseProfilePreferenceRow(data);
  if (!parsed) {
    return { ok: false };
  }

  return { ok: true, profile: parsed };
}

export async function updateProfilePreferences(
  userId: string,
  patch: Partial<ProfilePreferenceRow>,
  clientOverride?: ReturnType<typeof getSupabaseClient>,
): Promise<{ ok: true } | { ok: false }> {
  const client = clientOverride ?? getSupabaseClient();
  if (!client || Object.keys(patch).length === 0) {
    return { ok: false };
  }

  const { error } = await client.from('profiles').update(patch).eq('id', userId);
  if (error) {
    return { ok: false };
  }
  return { ok: true };
}

export type ProfilePreferenceSyncRuntime = {
  userId: string | null;
  onApplied: () => void;
  client?: ReturnType<typeof getSupabaseClient>;
};

let runtime: ProfilePreferenceSyncRuntime = {
  userId: null,
  onApplied: () => {},
};

let debounceHandle: ReturnType<typeof setTimeout> | undefined;
let loadGeneration = 0;

export function configureProfilePreferenceSync(next: ProfilePreferenceSyncRuntime): void {
  runtime = next;
}

export function clearProfilePreferenceSyncTimer(): void {
  if (debounceHandle !== undefined) {
    clearTimeout(debounceHandle);
    debounceHandle = undefined;
  }
}

export function scheduleProfilePreferenceSync(): void {
  if (!runtime.userId) {
    return;
  }
  clearProfilePreferenceSyncTimer();
  debounceHandle = setTimeout(() => {
    debounceHandle = undefined;
    void flushProfilePreferenceSync();
  }, PROFILE_PREFERENCE_SYNC_DEBOUNCE_MS);
}

export async function flushProfilePreferenceSync(): Promise<void> {
  const userId = runtime.userId;
  if (!userId) {
    return;
  }
  const patch = buildProfilePatchFromLocalStorage();
  await updateProfilePreferences(userId, patch, runtime.client);
}

export async function loadAndApplyProfilePreferences(userId: string): Promise<void> {
  const generation = ++loadGeneration;
  const result = await fetchProfilePreferences(userId, runtime.client);
  if (generation !== loadGeneration || runtime.userId !== userId) {
    return;
  }
  if (!result.ok) {
    return;
  }

  const localCardView = readLocalCardViewPreference();
  const localSearchTable = readLocalSearchTablePrefs();
  const merged = mergeProfilePreferencesOnSignIn({
    localCardView,
    localSearchTable,
    profile: result.profile,
  });

  let applied = false;
  if (merged.cardViewToApply !== null) {
    applyLocalCardViewPreference(merged.cardViewToApply);
    applied = true;
  }
  if (merged.tablePrefsToApply !== null) {
    applyLocalSearchTablePrefs(merged.tablePrefsToApply);
    applied = true;
  }

  if (Object.keys(merged.seedPatch).length > 0) {
    await updateProfilePreferences(userId, merged.seedPatch, runtime.client);
  }

  if (applied) {
    runtime.onApplied();
  }
}

export function resetProfilePreferenceLoadGeneration(): void {
  loadGeneration += 1;
}

/** @internal test helper */
export function getProfilePreferenceLoadGeneration(): number {
  return loadGeneration;
}

export function persistSearchCardViewPreference(mode: CatalogViewMode): void {
  applyLocalCardViewPreference(mode);
  scheduleProfilePreferenceSync();
}

export function persistSearchTablePreferences(snapshot: SearchTablePrefsSnapshot): void {
  applyLocalSearchTablePrefs(snapshot);
  scheduleProfilePreferenceSync();
}

export function readSearchTablePrefsForUi(): SearchTablePrefsSnapshot {
  return readLocalSearchTablePrefs() ?? defaultSearchTablePrefsSnapshot();
}
