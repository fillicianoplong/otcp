import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';

export type CardFinderViewMode = 'list' | 'grid';

/** Deck editor library only. Search keeps its own view preference. */
export const CARD_FINDER_VIEW_STORAGE_KEY = 'otcp:view:card-finder';

export function parseCardFinderViewMode(raw: string | null | undefined): CardFinderViewMode {
  return raw === 'grid' ? 'grid' : 'list';
}

export function readCardFinderViewMode(): CardFinderViewMode {
  return parseCardFinderViewMode(readLocalStorageString(CARD_FINDER_VIEW_STORAGE_KEY));
}

export function writeCardFinderViewMode(mode: CardFinderViewMode): void {
  writeLocalStorageString(CARD_FINDER_VIEW_STORAGE_KEY, mode);
}
