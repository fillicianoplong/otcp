import { describe, expect, it } from 'vitest';

import { findCatalogCardByRouteId } from '../../src/catalog/cardDetailRoute.ts';
import { getCatalogDerived } from '../../src/catalog/catalogDerived.ts';
import { buildSearchCardDetailPath } from '../../src/catalog/searchCardLinks.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import { R2_CARD_IMAGES_PUBLIC_BASE_URL } from '../../src/shared/cardImageUrls.ts';

const darkMagician: YugiohCard = {
  schemaVersion: '1.0.0',
  id: 46986420,
  name: 'Dark Magician',
  type: 'Normal Monster',
  text: 'The ultimate wizard in terms of attack and defense.',
  images: {
    small: `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/small/46986420.webp`,
    large: `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/large/46986420.webp`,
  },
  sets: [],
  artIds: [46986420, 46986421, 46986414],
};

describe('buildSearchCardDetailPath', () => {
  it('uses the artwork passcode in the path for alternate art links', () => {
    expect(buildSearchCardDetailPath(46986420, { artId: 46986421 })).toBe('/search/card/46986421');
  });

  it('keeps search context on the query string only', () => {
    expect(
      buildSearchCardDetailPath(46986420, {
        searchQuery: 'dark',
        formatParam: 'advanced',
        artId: 46986421,
      }),
    ).toBe('/search/card/46986421?q=dark&format=advanced');
  });
});

describe('findCatalogCardByRouteId', () => {
  it('maps an alternate passcode to the catalog card and art id', () => {
    const derived = getCatalogDerived([darkMagician]);
    const resolved = findCatalogCardByRouteId(derived, 46986421);
    expect(resolved?.card.id).toBe(46986420);
    expect(resolved?.selectedArtId).toBe(46986421);
  });
});
