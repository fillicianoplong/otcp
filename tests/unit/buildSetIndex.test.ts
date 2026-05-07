import { describe, expect, it } from 'vitest';

import { buildSetIndex } from '../../pipeline/buildSetIndex.ts';
import cardsetsFixture from '../fixtures/pipeline/ygoprodeck-cardsets-snippet.json';

describe('buildSetIndex', () => {
  it('maps YGOPRODeck cardsets rows to setName keys', () => {
    const index = buildSetIndex(cardsetsFixture);
    expect(index['Starter Deck: Yugi']).toEqual({
      tcgDate: '2002-03-08',
      numOfCards: 50,
    });
    expect(index['Legend of Blue Eyes White Dragon']?.numOfCards).toBe(126);
  });
});
