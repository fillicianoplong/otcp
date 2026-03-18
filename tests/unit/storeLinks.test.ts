import { describe, expect, it } from 'vitest';

import { buildStoreSearchUrl } from '../../src/prices/storeLinks.ts';

describe('buildStoreSearchUrl', () => {
  it('builds TCGplayer search URLs with encoded names', () => {
    expect(buildStoreSearchUrl('tcgplayer', 'Dark Magician')).toBe(
      'https://www.tcgplayer.com/search/yugioh/product?q=Dark%20Magician',
    );
  });

  it('builds CoolStuffInc searchOnName URLs with form-encoded names', () => {
    expect(buildStoreSearchUrl('coolstuffinc', 'Dark Magician')).toBe(
      'https://www.coolstuffinc.com/main_search.php?pa=searchOnName&page=1&resultsPerPage=25&q=Dark+Magician',
    );
    expect(buildStoreSearchUrl('coolstuffinc', 'A Case for K9')).toBe(
      'https://www.coolstuffinc.com/main_search.php?pa=searchOnName&page=1&resultsPerPage=25&q=A+Case+for+K9',
    );
    expect(buildStoreSearchUrl('coolstuffinc', 'Tom & Jerry')).toBe(
      'https://www.coolstuffinc.com/main_search.php?pa=searchOnName&page=1&resultsPerPage=25&q=Tom+%26+Jerry',
    );
    expect(buildStoreSearchUrl('coolstuffinc', 'Spell/Trap: Wall')).toBe(
      'https://www.coolstuffinc.com/main_search.php?pa=searchOnName&page=1&resultsPerPage=25&q=Spell%2FTrap%3A+Wall',
    );
  });

  it('builds Cardmarket search URLs with encoded names', () => {
    expect(buildStoreSearchUrl('cardmarket', 'Dark Magician')).toBe(
      'https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=Dark%20Magician',
    );
  });

  it('encodes quotes, ampersands, and accents in the query', () => {
    const name = 'A "Test" & Café';
    const encoded = encodeURIComponent(name);
    expect(buildStoreSearchUrl('tcgplayer', name)).toBe(
      `https://www.tcgplayer.com/search/yugioh/product?q=${encoded}`,
    );
    expect(buildStoreSearchUrl('cardmarket', name)).toBe(
      `https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=${encoded}`,
    );
  });

  it('trims surrounding whitespace before encoding', () => {
    expect(buildStoreSearchUrl('tcgplayer', '  Dark Magician  ')).toBe(
      'https://www.tcgplayer.com/search/yugioh/product?q=Dark%20Magician',
    );
    expect(buildStoreSearchUrl('coolstuffinc', '  Dark Magician  ')).toBe(
      'https://www.coolstuffinc.com/main_search.php?pa=searchOnName&page=1&resultsPerPage=25&q=Dark+Magician',
    );
  });
});
