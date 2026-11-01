import { describe, expect, it } from 'vitest';

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
    );
    expect(card.prices).toEqual({
      tcgplayer: 1.23,
      coolstuffinc: 1.1,
      cardmarket: 0.95,
    });
  });

  it('omits prices when upstream values are missing', () => {
    const card = mapYgoprodeckCard(makeRow({ tcgplayer_price: '2.00' }));
    expect(card.prices).toEqual({ tcgplayer: 2 });
  });

  it('maps zero as a numeric price', () => {
    const card = mapYgoprodeckCard(
      makeRow({
        tcgplayer_price: '0',
        coolstuffinc_price: '0.00',
        cardmarket_price: '0',
      }),
    );
    expect(card.prices).toEqual({
      tcgplayer: 0,
      coolstuffinc: 0,
      cardmarket: 0,
    });
  });
});
