import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';

export type DeckZoneViewMode = 'list' | 'grid';

/** Deck list (Main / Extra / Side) only. The card library keeps its own key. */
export const DECK_ZONE_VIEW_STORAGE_KEY = 'otcp:view:deck-zones';

/** Layout class for the deck grid. Column size comes from the shared tile width. */
export const DECK_ZONE_GRID_CLASS = 'grid w-full min-w-0 justify-start';

export function parseDeckZoneViewMode(raw: string | null | undefined): DeckZoneViewMode {
  return raw === 'list' ? 'list' : 'grid';
}

export function readDeckZoneViewMode(): DeckZoneViewMode {
  return parseDeckZoneViewMode(readLocalStorageString(DECK_ZONE_VIEW_STORAGE_KEY));
}

export function writeDeckZoneViewMode(mode: DeckZoneViewMode): void {
  writeLocalStorageString(DECK_ZONE_VIEW_STORAGE_KEY, mode);
}
