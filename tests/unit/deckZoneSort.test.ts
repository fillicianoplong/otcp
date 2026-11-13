/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  DECK_ZONE_SORT_STORAGE_KEY,
  orderZoneCards,
  readDeckZoneSortMode,
  writeDeckZoneSortMode,
} from '../../src/deckEditor/deckZoneSort.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

function named(id: number, name: string, type: string): YugiohCard {
  return { id, name, type } as YugiohCard;
}

const cards = new Map<number, YugiohCard>([
  [1, named(1, 'Mirror Force', 'Trap Card')],
  [2, named(2, 'Dark Magician', 'Normal Monster')],
  [4, named(4, 'Monster Reborn', 'Spell Card')],
  [3, named(3, 'Blue-Eyes White Dragon', 'Normal Monster')],
]);

describe('deck zone sort', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to type and stores the choice', () => {
    expect(readDeckZoneSortMode()).toBe('type');
    writeDeckZoneSortMode('name');
    expect(localStorage.getItem(DECK_ZONE_SORT_STORAGE_KEY)).toBe('name');
    expect(readDeckZoneSortMode()).toBe('name');
    writeDeckZoneSortMode('added');
    expect(readDeckZoneSortMode()).toBe('added');
  });

  it('orders monsters, then spells, then traps, and keeps each copy', () => {
    const ordered = orderZoneCards([1, 2, 2, 4, 3], cards, 'type');
    expect(ordered.map((entry) => entry.cardId)).toEqual([3, 2, 2, 4, 1]);
    expect(ordered.filter((entry) => entry.cardId === 2).map((entry) => entry.sourceIndex)).toEqual(
      [1, 2],
    );
  });

  it('orders by name and can keep added order', () => {
    expect(orderZoneCards([1, 2, 4, 3], cards, 'name').map((entry) => entry.cardId)).toEqual([
      3, 2, 1, 4,
    ]);
    expect(orderZoneCards([1, 2, 4, 3], cards, 'added').map((entry) => entry.cardId)).toEqual([
      1, 2, 4, 3,
    ]);
  });
});
