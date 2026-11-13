import { describe, expect, it } from 'vitest';

import {
  listDeckCoverOptions,
  resolveDisplayedCover,
  uniqueDeckCardIds,
} from '../../src/deckList/deckCover.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

const darkMagician = {
  id: 46986420,
  name: 'Dark Magician',
  artIds: [46986420, 46986421, 46986414, 46986415, 46986416],
} as YugiohCard;

const blueEyes = {
  id: 89631139,
  name: 'Blue-Eyes White Dragon',
} as YugiohCard;

const cardsById = new Map<number, YugiohCard>([
  [darkMagician.id, darkMagician],
  [blueEyes.id, blueEyes],
]);

describe('deck list covers', () => {
  it('uses the first card when no cover is chosen and a placeholder when the deck is empty', () => {
    expect(resolveDisplayedCover({ main: [], extra: [], side: [] })).toBeNull();

    expect(
      resolveDisplayedCover({
        main: [89631139, 89631139],
        extra: [46986420],
        side: [],
      }),
    ).toEqual({ cardId: 89631139, artId: 89631139 });

    expect(resolveDisplayedCover({ main: [89631139], extra: [], side: [] }, cardsById)?.artId).toBe(
      89631139,
    );
  });

  it('keeps a chosen card and artwork while that card is in the deck', () => {
    const deck = {
      main: [89631139],
      extra: [46986420],
      side: [],
      cover: { cardId: 46986420, artId: 46986414 },
    };

    expect(resolveDisplayedCover(deck, cardsById)).toEqual({
      cardId: 46986420,
      artId: 46986414,
    });

    expect(resolveDisplayedCover({ ...deck, extra: [], cover: deck.cover }, cardsById)).toEqual({
      cardId: 89631139,
      artId: 89631139,
    });
  });

  it('lists each artwork once, in deck order, including a skill', () => {
    expect(
      uniqueDeckCardIds({
        main: [89631139, 89631139],
        extra: [46986420],
        side: [89631139],
        skillId: 300302050,
      }),
    ).toEqual([89631139, 46986420, 300302050]);

    const options = listDeckCoverOptions(
      { main: [46986420], extra: [], side: [], skillId: 89631139 },
      cardsById,
    );
    expect(options.map((option) => option.label)).toEqual([
      'Dark Magician',
      'Dark Magician, artwork 2 of 5',
      'Dark Magician, artwork 3 of 5',
      'Dark Magician, artwork 4 of 5',
      'Dark Magician, artwork 5 of 5',
      'Blue-Eyes White Dragon',
    ]);
    expect(options[1]).toMatchObject({ cardId: 46986420, artId: 46986421 });
  });
});
