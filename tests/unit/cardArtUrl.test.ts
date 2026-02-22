import { describe, expect, it } from 'vitest';

import { cardDetailImageFallback, cardDetailImageSrc } from '../../src/catalog/cardArtUrl.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

const sampleCard: YugiohCard = {
  schemaVersion: '1.0.0',
  id: 46986420,
  name: 'Dark Magician',
  type: 'Normal Monster',
  text: 'test',
  images: {
    small: '/otcp/card-images/small/46986420.jpg',
    large: '/otcp/card-images/46986420.jpg',
  },
  sets: [],
};

describe('cardArtUrl', () => {
  it('uses the small same-origin image for detail when large art is not published', () => {
    expect(cardDetailImageSrc(sampleCard)).toBe('/otcp/card-images/small/46986420.jpg');
  });

  it('falls back to small when a larger URL fails to load', () => {
    expect(cardDetailImageFallback(sampleCard, sampleCard.images.large)).toBe(
      sampleCard.images.small,
    );
    expect(cardDetailImageFallback(sampleCard, sampleCard.images.small)).toBeUndefined();
  });
});
