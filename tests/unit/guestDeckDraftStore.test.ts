/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  clearGuestDeckDraftsStorage,
  createGuestDeckDraft,
  getGuestDeckDraft,
  GUEST_DECK_DRAFTS_STORAGE_KEY,
  GUEST_DECK_DRAFTS_STORAGE_VERSION,
  listGuestDeckDrafts,
  removeGuestDeckDraft,
  updateGuestDeckDraft,
} from '../../src/deckStore/guestDeckDraftStore.ts';
import { readLocalStorageString } from '../../src/shared/safeLocalStorage.ts';

describe('guestDeckDraftStore', () => {
  afterEach(() => {
    clearGuestDeckDraftsStorage();
  });

  it('round-trips create, list, get, update, and remove', () => {
    expect(listGuestDeckDrafts()).toEqual([]);

    const created = createGuestDeckDraft({ name: 'Test deck', main: [12345678] });
    expect(created.name).toBe('Test deck');
    expect(created.main).toEqual([12345678]);

    const listed = listGuestDeckDrafts();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.id);

    expect(getGuestDeckDraft(created.id)?.name).toBe('Test deck');
    expect(getGuestDeckDraft('missing')).toBeNull();

    const updated = updateGuestDeckDraft(created.id, {
      name: 'Renamed',
      side: [87654321],
    });
    expect(updated?.name).toBe('Renamed');
    expect(updated?.side).toEqual([87654321]);
    expect(getGuestDeckDraft(created.id)?.name).toBe('Renamed');

    const withCover = updateGuestDeckDraft(created.id, {
      cover: { cardId: 89631139, artId: 46986414 },
    });
    expect(withCover?.cover).toEqual({ cardId: 89631139, artId: 46986414 });
    expect(getGuestDeckDraft(created.id)?.cover).toEqual({
      cardId: 89631139,
      artId: 46986414,
    });

    expect(updateGuestDeckDraft(created.id, { cover: null })?.cover).toBeUndefined();
    expect(getGuestDeckDraft(created.id)?.cover).toBeUndefined();

    expect(removeGuestDeckDraft(created.id)).toBe(true);
    expect(listGuestDeckDrafts()).toEqual([]);
    expect(removeGuestDeckDraft(created.id)).toBe(false);
  });

  it('persists through a reload simulation', () => {
    const created = createGuestDeckDraft({ name: 'Persist me' });
    const raw = readLocalStorageString(GUEST_DECK_DRAFTS_STORAGE_KEY);
    expect(raw).toContain('"version":2');
    expect(raw).toContain('"formatId":"advanced"');
    expect(raw).toContain('Persist me');

    clearGuestDeckDraftsStorage();
    localStorage.setItem(GUEST_DECK_DRAFTS_STORAGE_KEY, raw!);

    expect(listGuestDeckDrafts()).toHaveLength(1);
    expect(listGuestDeckDrafts()[0]?.id).toBe(created.id);
  });

  it('returns an empty list for corrupt JSON', () => {
    localStorage.setItem(GUEST_DECK_DRAFTS_STORAGE_KEY, '{not-json');
    expect(listGuestDeckDrafts()).toEqual([]);
  });

  it('returns an empty list for unsupported storage versions', () => {
    localStorage.setItem(
      GUEST_DECK_DRAFTS_STORAGE_KEY,
      JSON.stringify({
        version: GUEST_DECK_DRAFTS_STORAGE_VERSION + 1,
        drafts: [
          {
            id: 'old',
            name: 'Old',
            main: [],
            extra: [],
            side: [],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    );
    expect(listGuestDeckDrafts()).toEqual([]);
  });

  it('keeps a draft when its cover field is invalid', () => {
    localStorage.setItem(
      GUEST_DECK_DRAFTS_STORAGE_KEY,
      JSON.stringify({
        version: GUEST_DECK_DRAFTS_STORAGE_VERSION,
        drafts: [
          {
            id: 'kept',
            name: 'Kept',
            formatId: 'advanced',
            main: [89631139],
            extra: [],
            side: [],
            cover: { cardId: 'nope', artId: 1 },
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    );

    const listed = listGuestDeckDrafts();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.name).toBe('Kept');
    expect(listed[0]?.cover).toBeUndefined();
  });

  it('ignores drafts with invalid card ids', () => {
    localStorage.setItem(
      GUEST_DECK_DRAFTS_STORAGE_KEY,
      JSON.stringify({
        version: GUEST_DECK_DRAFTS_STORAGE_VERSION,
        drafts: [
          {
            id: 'bad',
            name: 'Bad',
            main: ['not-a-number'],
            extra: [],
            side: [],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    );
    expect(listGuestDeckDrafts()).toEqual([]);
  });
});
