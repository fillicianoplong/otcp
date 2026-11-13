import { describe, expect, it } from 'vitest';

import { bundledDevArtUrl, devArtFallbackEnabled } from '../../src/catalog/bundledDevArt.ts';

describe('bundledDevArtUrl', () => {
  it('maps sample Dark Magician art ids when dev fallback is enabled', () => {
    if (!devArtFallbackEnabled()) {
      expect(bundledDevArtUrl(46986421, 'small')).toBeNull();
      return;
    }
    expect(bundledDevArtUrl(46986421, 'small')).toContain('/dev-art/ygo/small/46986421.webp');
    expect(bundledDevArtUrl(46986414, 'large')).toContain('/dev-art/ygo/large/46986414.webp');
  });

  it('returns null for unrelated image ids', () => {
    expect(bundledDevArtUrl(89631139, 'small')).toBeNull();
  });
});
