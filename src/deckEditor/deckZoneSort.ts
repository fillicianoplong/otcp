import { readLocalStorageString, writeLocalStorageString } from '../shared/safeLocalStorage.ts';
import type { YugiohCard } from '../shared/schema/card.ts';

export type DeckZoneSortMode = 'type' | 'name' | 'added';

export const DECK_ZONE_SORT_STORAGE_KEY = 'otcp:sort:deck-zones';

export type OrderedZoneCard = {
  cardId: number;
  sourceIndex: number;
};

export function parseDeckZoneSortMode(raw: string | null | undefined): DeckZoneSortMode {
  if (raw === 'name' || raw === 'added') return raw;
  return 'type';
}

export function readDeckZoneSortMode(): DeckZoneSortMode {
  return parseDeckZoneSortMode(readLocalStorageString(DECK_ZONE_SORT_STORAGE_KEY));
}

export function writeDeckZoneSortMode(mode: DeckZoneSortMode): void {
  writeLocalStorageString(DECK_ZONE_SORT_STORAGE_KEY, mode);
}

/** Monsters, then Spells, then Traps. Anything else sorts with monsters. */
export function deckCardKind(card: Pick<YugiohCard, 'type'>): 0 | 1 | 2 {
  const type = card.type.toLowerCase();
  if (type.includes('trap')) return 2;
  if (type.includes('spell')) return 1;
  return 0;
}

function compareKnownCards(left: YugiohCard, right: YugiohCard, sort: DeckZoneSortMode): number {
  if (sort === 'type') {
    const kind = deckCardKind(left) - deckCardKind(right);
    if (kind !== 0) return kind;
  }
  return left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
}

/**
 * One entry per copy. Type order is monsters, spells, traps, then name.
 * Name order is alphabetical. Added order keeps the zone array.
 * Copies of the same card stay in the order they were added.
 */
export function orderZoneCards(
  ids: readonly number[],
  cardsById: ReadonlyMap<number, YugiohCard>,
  sort: DeckZoneSortMode,
): OrderedZoneCard[] {
  const entries = ids.map((cardId, sourceIndex) => ({ cardId, sourceIndex }));
  if (sort === 'added') return entries;
  entries.sort((left, right) => {
    const leftCard = cardsById.get(left.cardId);
    const rightCard = cardsById.get(right.cardId);
    if (!leftCard && !rightCard) return left.sourceIndex - right.sourceIndex;
    if (!leftCard) return 1;
    if (!rightCard) return -1;
    const compared = compareKnownCards(leftCard, rightCard, sort);
    if (compared !== 0) return compared;
    return left.sourceIndex - right.sourceIndex;
  });
  return entries;
}
