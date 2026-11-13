import { describe, expect, it } from 'vitest';

import {
  catalogLargeImageUrl,
  catalogSmallImageUrl,
  expandCardsToArtTiles,
  resolveArtIds,
} from '../../src/catalog/cardArt.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import { R2_CARD_IMAGES_PUBLIC_BASE_URL } from '../../src/shared/cardImageUrls.ts';

const multiArtCard: YugiohCard = {
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

describe('expandCardsToArtTiles', () => {
  it('expands to one tile per artwork', () => {
    const tiles = expandCardsToArtTiles([multiArtCard]);
    expect(tiles).toHaveLength(3);
    expect(tiles.map((tile) => tile.imageId)).toEqual([46986420, 46986421, 46986414]);
  });
});

describe('catalog image URLs', () => {
  it('uses legacy card-id keys for the default art and image-id keys for alternates', () => {
    expect(catalogSmallImageUrl(multiArtCard, 46986420)).toContain('/ygo/small/46986420.webp');
    expect(catalogSmallImageUrl(multiArtCard, 46986421)).toContain('/ygo/small/46986421.webp');
    expect(catalogLargeImageUrl(multiArtCard, 46986414)).toContain('/ygo/large/46986414.webp');
  });

  it('falls back to the card id when artIds is missing', () => {
    const single = { ...multiArtCard, artIds: undefined };
    expect(resolveArtIds(single)).toEqual([46986420]);
  });
});
