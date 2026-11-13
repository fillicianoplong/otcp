import { describe, expect, it } from 'vitest';

import {
  CARD_DETAIL_MARKET_PRICE_ROWS,
  CARD_DETAIL_MARKET_PRICE_SUBTITLE,
  cardDetailMarketPriceDisplay,
} from '../../src/catalog/cardDetailMarketPrices.ts';

describe('cardDetailMarketPrices', () => {
  it('uses the lowest-across-printings subtitle on every store row', () => {
    expect(CARD_DETAIL_MARKET_PRICE_SUBTITLE).toBe('Lowest across printings');
    expect(CARD_DETAIL_MARKET_PRICE_ROWS.map((row) => row.label)).toEqual([
      'TCGplayer',
      'CoolStuffInc',
      'Cardmarket',
    ]);
  });

  it('returns null for missing or zero prices', () => {
    expect(cardDetailMarketPriceDisplay(undefined, 'USD')).toBeNull();
    expect(cardDetailMarketPriceDisplay(0, 'USD')).toBeNull();
    expect(cardDetailMarketPriceDisplay(1.25, 'USD')).toBe('$1.25');
  });
});
