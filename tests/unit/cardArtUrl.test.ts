import { describe, expect, it } from 'vitest';

import {
  cardDetailImageFallback,
  cardDetailImageSrc,
  YGO_CARD_ART_ASPECT_CLASS,
  YGO_CARD_ART_HEIGHT,
  YGO_CARD_ART_WIDTH,
} from '../../src/catalog/cardArtUrl.ts';
import { R2_CARD_IMAGES_PUBLIC_BASE_URL } from '../../pipeline/constants.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';

const sampleCard: YugiohCard = {
  schemaVersion: '1.0.0',
  id: 46986420,
  name: 'Dark Magician',
  type: 'Normal Monster',
  text: 'test',
  images: {
    small: `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/small/46986420.webp`,
    large: `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/large/46986420.webp`,
  },
  sets: [],
};

describe('cardArtUrl', () => {
  it('documents the published card art aspect ratio for layout frames', () => {
    expect(YGO_CARD_ART_WIDTH / YGO_CARD_ART_HEIGHT).toBeCloseTo(421 / 614, 5);
    expect(YGO_CARD_ART_ASPECT_CLASS).toBe('aspect-[421/614]');
  });

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
