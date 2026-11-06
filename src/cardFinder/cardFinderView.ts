import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';

export type CardFinderViewMode = 'list' | 'grid';

/** Deck editor library only. Search keeps its own view preference. */
export const CARD_FINDER_VIEW_STORAGE_KEY = 'otcp:view:card-finder';

/** Below this viewport width the library grid uses two columns so tiles stay on screen. */
export const CARD_FINDER_GRID_THREE_MIN_WIDTH_PX = 340;

export function parseCardFinderViewMode(raw: string | null | undefined): CardFinderViewMode {
  return raw === 'grid' ? 'grid' : 'list';
}

export function readCardFinderViewMode(): CardFinderViewMode {
  return parseCardFinderViewMode(readLocalStorageString(CARD_FINDER_VIEW_STORAGE_KEY));
}

export function writeCardFinderViewMode(mode: CardFinderViewMode): void {
  writeLocalStorageString(CARD_FINDER_VIEW_STORAGE_KEY, mode);
}

export function cardFinderGridColumnCount(viewportWidthCssPx: number): number {
  return viewportWidthCssPx >= CARD_FINDER_GRID_THREE_MIN_WIDTH_PX ? 3 : 2;
}

/** Two columns on a very narrow phone; three from 340px, including the desktop finder panel. */
export const CARD_FINDER_GRID_CLASS =
  'grid w-full min-w-0 grid-cols-2 gap-2 min-[340px]:grid-cols-3';
