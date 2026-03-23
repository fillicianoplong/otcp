import { describe, expect, it } from 'vitest';

import { cardDetailImageFallback, cardDetailImageSrc } from '../../src/catalog/cardArtUrl.ts';
import { R2_CARD_IMAGES_PUBLIC_BASE_URL } from '../../pipeline/constants.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

const sampleCard: YugiohCard = {
  schemaVersion: '1.0.0',
  id: 46986420,
  name: 'Dark Magician',
  type: 'Normal Monster',
  text: 'test',
  images: {
    small: '/otcp/card-images/small/46986420.jpg',
    large: `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/large/46986420.webp`,
  },
  sets: [],
};

describe('cardArtUrl', () => {
  it('uses the large published image URL on the detail page', () => {
    expect(cardDetailImageSrc(sampleCard)).toBe(sampleCard.images.large);
  });

  it('falls back to small when the large URL fails to load', () => {
    expect(cardDetailImageFallback(sampleCard, sampleCard.images.large)).toBe(
      sampleCard.images.small,
    );
    expect(cardDetailImageFallback(sampleCard, sampleCard.images.small)).toBeUndefined();
  });
});
