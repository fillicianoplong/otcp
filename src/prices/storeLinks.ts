export type StoreKey = 'tcgplayer' | 'coolstuffinc' | 'cardmarket';

const STORE_SEARCH_TEMPLATES: Record<StoreKey, (encodedName: string) => string> = {
  tcgplayer: (encodedName) => `https://www.tcgplayer.com/search/yugioh/product?q=${encodedName}`,
  coolstuffinc: (encodedName) =>
    `https://www.coolstuffinc.com/main_search.php?ul=Search&view=all&cg=Cards&q=${encodedName}`,
  cardmarket: (encodedName) =>
    `https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=${encodedName}`,
};

export const STORE_LINK_LABELS: Record<StoreKey, string> = {
  tcgplayer: 'Open on TCGplayer',
  coolstuffinc: 'Open on CoolStuffInc',
  cardmarket: 'Open on Cardmarket',
};

/** Builds a vendor search URL from the card display name (no network I/O). */
export function buildStoreSearchUrl(store: StoreKey, cardName: string): string {
  const encodedName = encodeURIComponent(cardName.trim());
  return STORE_SEARCH_TEMPLATES[store](encodedName);
}

export function buildStoreSearchUrls(cardName: string): Record<StoreKey, string> {
  return {
    tcgplayer: buildStoreSearchUrl('tcgplayer', cardName),
    coolstuffinc: buildStoreSearchUrl('coolstuffinc', cardName),
    cardmarket: buildStoreSearchUrl('cardmarket', cardName),
  };
}
