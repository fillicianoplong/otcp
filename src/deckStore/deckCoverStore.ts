import { z } from 'zod';

import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';
import type { DeckCover } from './types.ts';

/**
 * Saved deck rows have no cover column. This map keeps a chosen cover next to
 * the saved deck id in browser storage so the list card survives a reload.
 * Guest drafts store their cover on the draft document instead.
 */
export const DECK_COVERS_STORAGE_KEY = 'otcp:deck-covers:v1';

const DECK_COVERS_STORAGE_VERSION = 1;

const deckCoverSchema = z.object({
  cardId: z.number().int().positive(),
  artId: z.number().int().positive(),
});

export function parseDeckCover(value: unknown): DeckCover | null {
  const parsed = deckCoverSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function readAll(): Record<string, DeckCover> {
  const raw = readLocalStorageString(DECK_COVERS_STORAGE_KEY);
  if (raw === null || raw.length === 0) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {};
  }

  const record = parsed as { version?: unknown; covers?: unknown };
  if (record.version !== DECK_COVERS_STORAGE_VERSION || typeof record.covers !== 'object') {
    return {};
  }
  if (record.covers === null) {
    return {};
  }

  const covers: Record<string, DeckCover> = {};
  for (const [deckId, value] of Object.entries(record.covers)) {
    const cover = parseDeckCover(value);
    if (cover && deckId.length > 0) {
      covers[deckId] = cover;
    }
  }
  return covers;
}

function writeAll(covers: Record<string, DeckCover>): void {
  writeLocalStorageString(
    DECK_COVERS_STORAGE_KEY,
    JSON.stringify({ version: DECK_COVERS_STORAGE_VERSION, covers }),
  );
}

export function readDeckCover(deckId: string): DeckCover | null {
  return readAll()[deckId] ?? null;
}

/** Pass null to forget the cover for a saved deck. */
export function writeDeckCover(deckId: string, cover: DeckCover | null): void {
  if (deckId.length === 0) {
    return;
  }
  const covers = readAll();
  if (cover === null) {
    delete covers[deckId];
  } else {
    const parsed = parseDeckCover(cover);
    if (!parsed) {
      return;
    }
    covers[deckId] = parsed;
  }
  writeAll(covers);
}

export function clearDeckCoversStorage(): void {
  writeLocalStorageString(DECK_COVERS_STORAGE_KEY, '');
  try {
    localStorage.removeItem(DECK_COVERS_STORAGE_KEY);
  } catch {
    // ignore
  }
}
