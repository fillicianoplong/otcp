import { describe, expect, it } from 'vitest';

import { R2_CARD_IMAGES_PUBLIC_BASE_URL } from '../../pipeline/constants.ts';
import { mapYgoprodeckCard } from '../../pipeline/mapYgoprodeck.ts';
import type { YgoApiCard } from '../../pipeline/ygoprodeckTypes.ts';

function makeRow(prices: NonNullable<YgoApiCard['card_prices']>[number]): YgoApiCard {
  return {
    id: 46986420,
    name: 'Dark Magician',
    desc: 'The ultimate wizard in terms of attack and defense.',
    type: 'Normal Monster',
    card_prices: [prices],
  };
}

describe('mapYgoprodeckCard prices', () => {
  it('maps all three storefront prices when present', () => {
    const card = mapYgoprodeckCard(
      makeRow({
        tcgplayer_price: '1.23',
        coolstuffinc_price: '1.10',
        cardmarket_price: '0.95',
      }),
      R2_CARD_IMAGES_PUBLIC_BASE_URL,
    );
    expect(card.prices).toEqual({
      tcgplayer: 1.23,
      coolstuffinc: 1.1,
      cardmarket: 0.95,
    });
  });

  it('omits prices when upstream values are missing', () => {
    const card = mapYgoprodeckCard(
      makeRow({ tcgplayer_price: '2.00' }),
      R2_CARD_IMAGES_PUBLIC_BASE_URL,
    );
    expect(card.prices).toEqual({ tcgplayer: 2 });
  });

  it('maps pendulum description fields when present', () => {
    const card = mapYgoprodeckCard(
      {
        id: 16178681,
        name: 'Odd-Eyes Pendulum Dragon',
        type: 'Pendulum Effect Monster',
        desc: 'Combined desc',
        pend_desc: 'Pendulum line',
        monster_desc: 'Monster line',
      },
      R2_CARD_IMAGES_PUBLIC_BASE_URL,
    );
    expect(card.pendDesc).toBe('Pendulum line');
    expect(card.monsterDesc).toBe('Monster line');
    expect(card.text).toBe('Combined desc');
  });

  it('maps zero as a numeric price', () => {
    const card = mapYgoprodeckCard(
      makeRow({
        tcgplayer_price: '0',
        coolstuffinc_price: '0.00',
        cardmarket_price: '0',
      }),
      R2_CARD_IMAGES_PUBLIC_BASE_URL,
    );
    expect(card.prices).toEqual({
      tcgplayer: 0,
      coolstuffinc: 0,
      cardmarket: 0,
    });
  });

  it('maps Xyz level to rank without level', () => {
    const card = mapYgoprodeckCard(
      {
        id: 123,
        name: 'Number 39',
        type: 'Xyz Monster',
        desc: 'x',
        level: 4,
      },
      R2_CARD_IMAGES_PUBLIC_BASE_URL,
    );
    expect(card.rank).toBe(4);
    expect(card.level).toBeUndefined();
  });

  it('maps Link monsters to linkRating without level or rank', () => {
    const card = mapYgoprodeckCard(
      {
        id: 456,
        name: 'Test Link',
        type: 'Link Monster',
        desc: 'x',
        level: 0,
        linkval: 1,
      },
      R2_CARD_IMAGES_PUBLIC_BASE_URL,
    );
    expect(card.linkRating).toBe(1);
    expect(card.level).toBeUndefined();
    expect(card.rank).toBeUndefined();
  });

  it('keeps Level 0 on Synchro monsters', () => {
    const card = mapYgoprodeckCard(
      {
        id: 789,
        name: 'Ultimaya Tzolkin',
        type: 'Synchro Monster',
        desc: 'x',
        level: 0,
      },
      R2_CARD_IMAGES_PUBLIC_BASE_URL,
    );
    expect(card.level).toBe(0);
    expect(card.rank).toBeUndefined();
    expect(card.linkRating).toBeUndefined();
  });
});
