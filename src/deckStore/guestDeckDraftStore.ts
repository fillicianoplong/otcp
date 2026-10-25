import { z } from 'zod';

import { type FormatId, isKnownFormatId } from '../format/formatCatalog.ts';
import { readFormatPreference, resolveFormatPreference } from '../format/formatPreference.ts';
import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';
import type { GuestDeckDraft, GuestDeckDraftInput, GuestDeckDraftUpdate } from './types.ts';

export const GUEST_DECK_DRAFTS_STORAGE_KEY = 'otcp:guest-deck-drafts:v1';

export const GUEST_DECK_DRAFTS_STORAGE_VERSION = 2;

const cardIdSchema = z.number().int().positive();

const formatIdSchema = z.string().refine((value) => isKnownFormatId(value), 'Unknown format');

const guestDeckDraftSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  formatId: formatIdSchema,
  main: z.array(cardIdSchema),
  extra: z.array(cardIdSchema),
  side: z.array(cardIdSchema),
  genesysCap: z.number().int().min(0).optional(),
  skillId: cardIdSchema.nullable().optional(),
  updatedAt: z.string().min(1),
});

const legacyGuestDeckDraftSchema = z.object({
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

const legacyStorageEnvelopeSchema = z.object({
  version: z.literal(1),
  drafts: z.array(legacyGuestDeckDraftSchema),
});

type StorageEnvelope = {
  version: typeof GUEST_DECK_DRAFTS_STORAGE_VERSION;
  drafts: GuestDeckDraft[];
};

function newDraftId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultFormatIdForNewDeck(): FormatId {
  const resolved = resolveFormatPreference({
    urlParam: null,
    storedRaw: readFormatPreference(),
  });
  return resolved.formatId ?? 'advanced';
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

  const current = storageEnvelopeSchema.safeParse(parsed);
  if (current.success) {
    return {
      version: current.data.version,
      drafts: current.data.drafts as GuestDeckDraft[],
    };
  }

  const legacy = legacyStorageEnvelopeSchema.safeParse(parsed);
  if (!legacy.success) {
    return null;
  }

  const migrated: StorageEnvelope = {
    version: GUEST_DECK_DRAFTS_STORAGE_VERSION,
    drafts: legacy.data.drafts.map((draft) => ({
      ...draft,
      formatId: defaultFormatIdForNewDeck(),
    })) as GuestDeckDraft[],
  };
  writeEnvelope(migrated.drafts);
  return migrated;
}

const guestDeckDraftListeners = new Set<() => void>();

/** Subscribe to guest-draft creates, updates, removals, and clears. */
export function subscribeGuestDeckDrafts(listener: () => void): () => void {
  guestDeckDraftListeners.add(listener);
  return () => {
    guestDeckDraftListeners.delete(listener);
  };
}

function notifyGuestDeckDraftsChanged(): void {
  for (const listener of guestDeckDraftListeners) {
    listener();
  }
}

function writeEnvelope(drafts: GuestDeckDraft[]): void {
  const envelope: StorageEnvelope = {
    version: GUEST_DECK_DRAFTS_STORAGE_VERSION,
    drafts,
  };
  writeLocalStorageString(GUEST_DECK_DRAFTS_STORAGE_KEY, JSON.stringify(envelope));
}

function publishGuestDeckDrafts(drafts: GuestDeckDraft[]): void {
  writeEnvelope(drafts);
  notifyGuestDeckDraftsChanged();
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
    formatId: input.formatId ?? defaultFormatIdForNewDeck(),
    main: input.main ?? [],
    extra: input.extra ?? [],
    side: input.side ?? [],
    ...(input.genesysCap != null ? { genesysCap: Math.trunc(input.genesysCap) } : {}),
    ...(input.skillId !== undefined ? { skillId: input.skillId } : {}),
    updatedAt: nowIso(),
  };

  const drafts = listGuestDeckDrafts();
  drafts.push(draft);
  publishGuestDeckDrafts(drafts);
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
    ...(update.formatId !== undefined ? { formatId: update.formatId } : {}),
    ...(update.main !== undefined ? { main: [...update.main] } : {}),
    ...(update.extra !== undefined ? { extra: [...update.extra] } : {}),
    ...(update.side !== undefined ? { side: [...update.side] } : {}),
    ...(update.genesysCap === null
      ? { genesysCap: undefined }
      : update.genesysCap !== undefined
        ? { genesysCap: Math.trunc(update.genesysCap) }
        : {}),
    ...(update.skillId !== undefined ? { skillId: update.skillId } : {}),
    updatedAt: nowIso(),
  };

  drafts[index] = next;
  publishGuestDeckDrafts(drafts);
  return next;
}

/** Remove a guest draft. Returns false when the id was not found. */
export function removeGuestDeckDraft(id: string): boolean {
  const drafts = listGuestDeckDrafts();
  const next = drafts.filter((draft) => draft.id !== id);
  if (next.length === drafts.length) {
    return false;
  }
  publishGuestDeckDrafts(next);
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
  notifyGuestDeckDraftsChanged();
}
