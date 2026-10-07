import { describe, expect, it } from 'vitest';

import {
  publicLargeImageUrl,
  publicSmallImageUrl,
  publishedDefaultArtPaths,
  publishedImagePathsByImageId,
  R2_CARD_IMAGES_PUBLIC_BASE_URL,
  r2LargeObjectKey,
  r2SmallObjectKey,
} from '../../src/shared/cardImageUrls.ts';

describe('cardImageUrls', () => {
  it('builds R2 keys and URLs from image ids', () => {
    expect(r2LargeObjectKey(46986421)).toBe('ygo/large/46986421.webp');
    expect(r2SmallObjectKey(46986421)).toBe('ygo/small/46986421.webp');
    expect(publicLargeImageUrl(46986421, R2_CARD_IMAGES_PUBLIC_BASE_URL)).toBe(
      `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/large/46986421.webp`,
    );
    expect(publicSmallImageUrl(46986421, R2_CARD_IMAGES_PUBLIC_BASE_URL)).toBe(
      `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/small/46986421.webp`,
    );
  });

  it('keeps default-art URLs on the card passcode object keys', () => {
    expect(publishedDefaultArtPaths(46986420).large).toContain('/ygo/large/46986420.webp');
    expect(publishedImagePathsByImageId(46986421).small).toContain('/ygo/small/46986421.webp');
  });
});
