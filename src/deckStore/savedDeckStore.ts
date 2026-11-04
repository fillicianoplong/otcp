import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { type FormatId } from '../format/formatCatalog.ts';
import { readFormatPreference, resolveFormatPreference } from '../format/formatPreference.ts';
import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';
import { getSupabaseClient } from '../shared/supabase/client.ts';
import { removeGuestDeckDraft } from './guestDeckDraftStore.ts';
import type { DeckStoreResult } from './outcomes.ts';
import type { GuestDeckDraft, SavedDeck, SavedDeckInput, SavedDeckUpdate } from './types.ts';

export const SAVED_DECK_SCHEMA_VERSION = 1;

export const OPEN_SAVED_DECK_STORAGE_KEY = 'otcp:open-saved-deck:v1';

const cardIdSchema = z.number().int().positive();

const cardIdArraySchema = z.array(cardIdSchema);

const savedDeckRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  format_id: z.string(),
  main: cardIdArraySchema,
  extra: cardIdArraySchema,
  side: cardIdArraySchema,
  updated_at: z.string(),
});

type SavedDeckRow = z.infer<typeof savedDeckRowSchema>;

function resolveClient(clientOverride?: SupabaseClient | null): SupabaseClient | null {
  if (clientOverride !== undefined) {
    return clientOverride;
  }
  return getSupabaseClient();
}

function unauthorized(): DeckStoreResult<never> {
  return {
    ok: false,
    code: 'unauthorized',
    message: 'Sign in to manage saved decks.',
    retryable: false,
  };
}

function notFound(): DeckStoreResult<never> {
  return { ok: false, code: 'not_found', message: 'Deck not found.', retryable: false };
}

function storeError(message: string, retryable = true): DeckStoreResult<never> {
  return { ok: false, code: 'error', message, retryable };
}

function parseCardIdArray(raw: unknown): number[] | null {
  const result = cardIdArraySchema.safeParse(raw);
  return result.success ? result.data : null;
}

function rowToSavedDeck(row: SavedDeckRow): SavedDeck | null {
  const formatId = row.format_id;
  if (formatId !== 'advanced' && formatId !== 'traditional') {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    formatId,
    main: row.main,
    extra: row.extra,
    side: row.side,
    updatedAt: row.updated_at,
  };
}

function defaultFormatIdForNewDeck(): FormatId {
  const resolved = resolveFormatPreference({
    urlParam: null,
    storedRaw: readFormatPreference(),
  });
  return resolved.formatId ?? 'advanced';
}

function guestDraftToInsertRow(draft: GuestDeckDraft, ownerId: string) {
  return {
    owner_id: ownerId,
    deck_schema_version: SAVED_DECK_SCHEMA_VERSION,
    name: draft.name,
    format_id: defaultFormatIdForNewDeck(),
    main: draft.main,
    extra: draft.extra,
    side: draft.side,
  };
}

function savedDeckInputToInsertRow(input: SavedDeckInput, ownerId: string) {
  return {
    owner_id: ownerId,
    deck_schema_version: SAVED_DECK_SCHEMA_VERSION,
    name: input.name.trim() || 'Untitled deck',
    format_id: input.formatId ?? defaultFormatIdForNewDeck(),
    main: input.main ?? [],
    extra: input.extra ?? [],
    side: input.side ?? [],
  };
}

export async function listSavedDecks(
  clientOverride?: SupabaseClient | null,
): Promise<DeckStoreResult<{ decks: SavedDeck[] }>> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return unauthorized();
  }

  try {
    const { data, error } = await client
      .from('decks')
      .select('id, name, format_id, main, extra, side, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      return storeError(error.message || 'Could not load saved decks.');
    }

    const decks: SavedDeck[] = [];
    for (const row of data ?? []) {
      const parsed = savedDeckRowSchema.safeParse(row);
      if (!parsed.success) {
        continue;
      }
      const deck = rowToSavedDeck(parsed.data);
      if (deck) {
        decks.push(deck);
      }
    }

    return { ok: true, decks };
  } catch {
    return storeError('Could not load saved decks.');
  }
}

export async function loadSavedDeck(
  deckId: string,
  clientOverride?: SupabaseClient | null,
): Promise<DeckStoreResult<{ deck: SavedDeck }>> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return unauthorized();
  }

  try {
    const { data, error } = await client
      .from('decks')
      .select('id, name, format_id, main, extra, side, updated_at')
      .eq('id', deckId)
      .maybeSingle();

    if (error) {
      return storeError(error.message || 'Could not load deck.');
    }
    if (!data) {
      return notFound();
    }

    const parsed = savedDeckRowSchema.safeParse(data);
    if (!parsed.success) {
      return storeError('Saved deck data is invalid.', false);
    }

    const deck = rowToSavedDeck(parsed.data);
    if (!deck) {
      return storeError('Saved deck data is invalid.', false);
    }

    return { ok: true, deck };
  } catch {
    return storeError('Could not load deck.');
  }
}

export async function saveGuestDraftToAccount(
  draft: GuestDeckDraft,
  clientOverride?: SupabaseClient | null,
): Promise<DeckStoreResult<{ id: string }>> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return unauthorized();
  }

  try {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const { data, error } = await client
      .from('decks')
      .insert(guestDraftToInsertRow(draft, session.user.id))
      .select('id')
      .single();

    if (error || !data?.id) {
      return storeError(error?.message || 'Could not save deck.');
    }

    return { ok: true, id: data.id as string };
  } catch {
    return storeError('Could not save deck.');
  }
}

export async function insertSavedDeck(
  input: SavedDeckInput,
  clientOverride?: SupabaseClient | null,
): Promise<DeckStoreResult<{ id: string }>> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return unauthorized();
  }

  try {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const { data, error } = await client
      .from('decks')
      .insert(savedDeckInputToInsertRow(input, session.user.id))
      .select('id')
      .single();

    if (error || !data?.id) {
      return storeError(error?.message || 'Could not save deck.');
    }

    return { ok: true, id: data.id as string };
  } catch {
    return storeError('Could not save deck.');
  }
}

export async function updateSavedDeck(
  deckId: string,
  update: SavedDeckUpdate,
  clientOverride?: SupabaseClient | null,
): Promise<DeckStoreResult> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return unauthorized();
  }

  const patch: Record<string, unknown> = {};
  if (update.name !== undefined) {
    patch.name = update.name.trim() || 'Untitled deck';
  }
  if (update.main !== undefined) {
    patch.main = update.main;
  }
  if (update.extra !== undefined) {
    patch.extra = update.extra;
  }
  if (update.side !== undefined) {
    patch.side = update.side;
  }
  if (update.formatId !== undefined) {
    patch.format_id = update.formatId;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: true };
  }

  try {
    const { data, error } = await client.from('decks').update(patch).eq('id', deckId).select('id');

    if (error) {
      return storeError(error.message || 'Could not update deck.');
    }
    if (!data || data.length === 0) {
      return notFound();
    }

    return { ok: true };
  } catch {
    return storeError('Could not update deck.');
  }
}

export async function renameSavedDeck(
  deckId: string,
  name: string,
  clientOverride?: SupabaseClient | null,
): Promise<DeckStoreResult> {
  return updateSavedDeck(deckId, { name }, clientOverride);
}

export async function importGuestDraftsToAccount(
  drafts: readonly GuestDeckDraft[],
  clientOverride?: SupabaseClient | null,
): Promise<DeckStoreResult<{ savedDeckIds: string[] }>> {
  const savedDeckIds: string[] = [];
  for (const draft of drafts) {
    const saved = await saveGuestDraftToAccount(draft, clientOverride);
    if (!saved.ok) {
      return saved;
    }
    savedDeckIds.push(saved.id);
    removeGuestDeckDraft(draft.id);
  }
  return { ok: true, savedDeckIds };
}

export async function deleteSavedDeck(
  deckId: string,
  clientOverride?: SupabaseClient | null,
): Promise<DeckStoreResult> {
  const client = resolveClient(clientOverride);
  if (!client) {
    return unauthorized();
  }

  try {
    const { data, error } = await client.from('decks').delete().eq('id', deckId).select('id');

    if (error) {
      return storeError(error.message || 'Could not remove deck.');
    }
    if (!data || data.length === 0) {
      return notFound();
    }

    return { ok: true };
  } catch {
    return storeError('Could not remove deck.');
  }
}

/** Remember which saved deck is open for editing (FR-38) until the builder consumes it. */
export function applyOpenSavedDeck(deck: SavedDeck): void {
  writeLocalStorageString(
    OPEN_SAVED_DECK_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      deckId: deck.id,
      name: deck.name,
      formatId: deck.formatId,
      main: deck.main,
      extra: deck.extra,
      side: deck.side,
      updatedAt: deck.updatedAt,
    }),
  );
}

export function readOpenSavedDeck(): SavedDeck | null {
  const raw = readLocalStorageString(OPEN_SAVED_DECK_STORAGE_KEY);
  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const main = parseCardIdArray(record.main);
    const extra = parseCardIdArray(record.extra);
    const side = parseCardIdArray(record.side);
    const formatId = record.formatId;
    if (
      typeof record.deckId !== 'string' ||
      typeof record.name !== 'string' ||
      typeof record.updatedAt !== 'string' ||
      (formatId !== 'advanced' && formatId !== 'traditional') ||
      !main ||
      !extra ||
      !side
    ) {
      return null;
    }

    return {
      id: record.deckId,
      name: record.name,
      formatId,
      main,
      extra,
      side,
      updatedAt: record.updatedAt,
    };
  } catch {
    return null;
  }
}

export function clearOpenSavedDeckStorage(): void {
  writeLocalStorageString(OPEN_SAVED_DECK_STORAGE_KEY, '');
  try {
    localStorage.removeItem(OPEN_SAVED_DECK_STORAGE_KEY);
  } catch {
    // ignore
  }
}
