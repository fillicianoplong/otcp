import { z } from 'zod';

import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';
import type { GuestDeckDraft, GuestDeckDraftInput, GuestDeckDraftUpdate } from './types.ts';

export const GUEST_DECK_DRAFTS_STORAGE_KEY = 'otcp:guest-deck-drafts:v1';

export const GUEST_DECK_DRAFTS_STORAGE_VERSION = 1;

const cardIdSchema = z.number().int().positive();

const guestDeckDraftSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  main: z.array(cardIdSchema),
  extra: z.array(cardIdSchema),
  side: z.array(cardIdSchema),
  updatedAt: z.string().min(1),
});

const storageEnvelopeSchema = z.object({
  version: z.literal(GUEST_DECK_DRAFTS_STORAGE_VERSION),
  drafts: z.array(guestDeckDraftSchema),
});

type StorageEnvelope = z.infer<typeof storageEnvelopeSchema>;

function newDraftId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readEnvelope(): StorageEnvelope | null {
  const raw = readLocalStorageString(GUEST_DECK_DRAFTS_STORAGE_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = storageEnvelopeSchema.safeParse(parsed);
  if (!result.success) {
    return null;
  }

  return result.data;
}

function writeEnvelope(drafts: GuestDeckDraft[]): void {
  const envelope: StorageEnvelope = {
    version: GUEST_DECK_DRAFTS_STORAGE_VERSION,
    drafts,
  };
  writeLocalStorageString(GUEST_DECK_DRAFTS_STORAGE_KEY, JSON.stringify(envelope));
}

function sortDrafts(drafts: GuestDeckDraft[]): GuestDeckDraft[] {
  return [...drafts].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

/** List guest deck drafts newest first. Corrupt or unsupported storage yields an empty list. */
export function listGuestDeckDrafts(): GuestDeckDraft[] {
  const envelope = readEnvelope();
  if (!envelope) {
    return [];
  }
  return sortDrafts(envelope.drafts);
}

/** Load one guest draft by id. */
export function getGuestDeckDraft(id: string): GuestDeckDraft | null {
  return listGuestDeckDrafts().find((draft) => draft.id === id) ?? null;
}

/** Create a guest deck draft and persist it. */
export function createGuestDeckDraft(input: GuestDeckDraftInput = {}): GuestDeckDraft {
  const draft: GuestDeckDraft = {
    id: newDraftId(),
    name: input.name?.trim() || 'Untitled deck',
    main: input.main ?? [],
    extra: input.extra ?? [],
    side: input.side ?? [],
    updatedAt: nowIso(),
  };

  const drafts = listGuestDeckDrafts();
  drafts.push(draft);
  writeEnvelope(drafts);
  return draft;
}

/** Update fields on a guest draft. Returns null when the id is missing. */
export function updateGuestDeckDraft(
  id: string,
  update: GuestDeckDraftUpdate,
): GuestDeckDraft | null {
  const drafts = listGuestDeckDrafts();
  const index = drafts.findIndex((draft) => draft.id === id);
  if (index === -1) {
    return null;
  }

  const current = drafts[index]!;
  const next: GuestDeckDraft = {
    ...current,
    ...(update.name !== undefined ? { name: update.name.trim() || 'Untitled deck' } : {}),
    ...(update.main !== undefined ? { main: [...update.main] } : {}),
    ...(update.extra !== undefined ? { extra: [...update.extra] } : {}),
    ...(update.side !== undefined ? { side: [...update.side] } : {}),
    updatedAt: nowIso(),
  };

  drafts[index] = next;
  writeEnvelope(drafts);
  return next;
}

/** Remove a guest draft. Returns false when the id was not found. */
export function removeGuestDeckDraft(id: string): boolean {
  const drafts = listGuestDeckDrafts();
  const next = drafts.filter((draft) => draft.id !== id);
  if (next.length === drafts.length) {
    return false;
  }
  writeEnvelope(next);
  return true;
}

/** Clear stored guest drafts (for tests). */
export function clearGuestDeckDraftsStorage(): void {
  writeLocalStorageString(GUEST_DECK_DRAFTS_STORAGE_KEY, '');
  try {
    localStorage.removeItem(GUEST_DECK_DRAFTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}
