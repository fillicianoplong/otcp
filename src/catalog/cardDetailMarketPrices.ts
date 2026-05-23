import type { CardPrices } from '../shared/schema/core.ts';
import { formatStorePrice, type StorePriceCurrency } from '../prices/formatPrice.ts';
import type { StoreKey } from '../prices/storeLinks.ts';

export type CardDetailMarketPriceRow = {
  label: string;
  key: StoreKey;
  currency: StorePriceCurrency;
};

/** YGOPRODeck card_prices are the lowest price across all printings per vendor field. */
export const CARD_DETAIL_MARKET_PRICE_SUBTITLE = 'Lowest across printings';

export const CARD_DETAIL_MARKET_PRICE_ROWS: CardDetailMarketPriceRow[] = [
  {
    label: 'TCGplayer',
    key: 'tcgplayer',
    currency: 'USD',
  },
  {
    label: 'CoolStuffInc',
    key: 'coolstuffinc',
    currency: 'USD',
  },
  {
    label: 'Cardmarket',
    key: 'cardmarket',
    currency: 'EUR',
  },
];

export function cardDetailMarketPriceDisplay(
  value: number | undefined,
  currency: StorePriceCurrency,
): string | null {
  if (value === undefined || value === 0) return null;
  return formatStorePrice(value, currency);
}

export function cardDetailMarketPriceValue(
  prices: CardPrices | undefined,
  key: StoreKey,
): number | undefined {
  return prices?.[key];
}
