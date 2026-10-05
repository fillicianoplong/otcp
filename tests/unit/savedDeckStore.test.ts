/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  applyOpenSavedDeck,
  clearOpenSavedDeckStorage,
  deleteSavedDeck,
  importGuestDraftsToAccount,
  listSavedDecks,
  loadSavedDeck,
  readOpenSavedDeck,
  renameSavedDeck,
  saveGuestDraftToAccount,
  updateSavedDeck,
} from '../../src/deckStore/savedDeckStore.ts';
import type { GuestDeckDraft } from '../../src/deckStore/types.ts';
import {
  clearGuestDeckDraftsStorage,
  createGuestDeckDraft,
  listGuestDeckDrafts,
} from '../../src/deckStore/guestDeckDraftStore.ts';

const sampleDraft: GuestDeckDraft = {
  id: 'draft-1',
  name: 'Test deck',
  formatId: 'advanced',
  main: [12345678],
  extra: [],
  side: [],
  updatedAt: '2026-11-04T00:00:00.000Z',
};

const sampleRow = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Cloud deck',
  format_id: 'advanced',
  main: [12345678],
  extra: [],
  side: [],
  updated_at: '2026-11-04T12:00:00.000Z',
};

function createDeckStoreMock(options: {
  session?: { user: { id: string } } | null;
  selectRows?: unknown[];
  selectSingle?: unknown | null;
  insertId?: string;
  updateRows?: unknown[];
  deleteRows?: unknown[];
  errors?: {
    select?: { message: string } | null;
    insert?: { message: string } | null;
    update?: { message: string } | null;
    delete?: { message: string } | null;
  };
}): SupabaseClient {
  const session = options.session ?? { user: { id: 'user-1' } };

  const auth = {
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
  };

  const from = vi.fn((table: string) => {
    expect(table).toBe('decks');
    return {
      select: vi.fn(() => ({
        order: vi.fn(async () => ({
          data: options.selectRows ?? [],
          error: options.errors?.select ?? null,
        })),
        eq: vi.fn(function eqColumn() {
          return {
            maybeSingle: vi.fn(async () => ({
              data: options.selectSingle ?? null,
              error: options.errors?.select ?? null,
            })),
            single: vi.fn(async () => ({
              data: options.selectSingle ?? null,
              error: options.errors?.select ?? null,
            })),
            select: vi.fn(async () => ({
              data: options.updateRows ?? options.deleteRows ?? [],
              error: options.errors?.update ?? options.errors?.delete ?? null,
            })),
          };
        }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: options.insertId ? { id: options.insertId } : null,
            error: options.errors?.insert ?? null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(async () => ({
            data: options.updateRows ?? [{ id: sampleRow.id }],
            error: options.errors?.update ?? null,
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(async () => ({
            data: options.deleteRows ?? [{ id: sampleRow.id }],
            error: options.errors?.delete ?? null,
          })),
        })),
      })),
    };
  });

  return { auth, from } as unknown as SupabaseClient;
}

describe('savedDeckStore', () => {
  afterEach(() => {
    clearOpenSavedDeckStorage();
    clearGuestDeckDraftsStorage();
  });

  it('lists saved decks for the signed-in user', async () => {
    const client = createDeckStoreMock({ selectRows: [sampleRow] });
    const result = await listSavedDecks(client);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decks).toHaveLength(1);
      expect(result.decks[0]?.name).toBe('Cloud deck');
    }
  });

  it('returns unauthorized when there is no client', async () => {
    const result = await listSavedDecks(null);
    expect(result).toEqual({
      ok: false,
      code: 'unauthorized',
      message: 'Sign in to manage saved decks.',
      retryable: false,
    });
  });

  it('loads, renames, updates, and deletes a deck', async () => {
    const loadClient = createDeckStoreMock({ selectSingle: sampleRow });
    const loaded = await loadSavedDeck(sampleRow.id, loadClient);
    expect(loaded.ok).toBe(true);

    const renameClient = createDeckStoreMock({ updateRows: [{ id: sampleRow.id }] });
    const renamed = await renameSavedDeck(sampleRow.id, 'Renamed', renameClient);
    expect(renamed.ok).toBe(true);

    const updateClient = createDeckStoreMock({ updateRows: [{ id: sampleRow.id }] });
    const updated = await updateSavedDeck(
      sampleRow.id,
      { main: [99999999], side: [88888888] },
      updateClient,
    );
    expect(updated.ok).toBe(true);

    const deleteClient = createDeckStoreMock({ deleteRows: [{ id: sampleRow.id }] });
    const deleted = await deleteSavedDeck(sampleRow.id, deleteClient);
    expect(deleted.ok).toBe(true);
  });

  it('saveGuestDraftToAccount inserts using the session user id', async () => {
    const client = createDeckStoreMock({ insertId: sampleRow.id });
    const result = await saveGuestDraftToAccount(sampleDraft, client);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.id).toBe(sampleRow.id);
    }
  });

  it('importGuestDraftsToAccount saves drafts and clears local storage', async () => {
    createGuestDeckDraft({ name: 'Import me', main: [11111111] });
    expect(listGuestDeckDrafts()).toHaveLength(1);

    const client = createDeckStoreMock({ insertId: sampleRow.id });
    const drafts = listGuestDeckDrafts();
    const result = await importGuestDraftsToAccount(drafts, client);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.savedDeckIds).toEqual([sampleRow.id]);
    }
    expect(listGuestDeckDrafts()).toEqual([]);
  });

  it('applyOpenSavedDeck round-trips through readOpenSavedDeck', async () => {
    const loadClient = createDeckStoreMock({ selectSingle: sampleRow });
    const loaded = await loadSavedDeck(sampleRow.id, loadClient);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    applyOpenSavedDeck(loaded.deck);
    expect(readOpenSavedDeck()?.name).toBe('Cloud deck');
  });
});
