import { describe, expect, it } from 'vitest';

import {
  clearYgoproArtIdCache,
  mapYgoproArtIds,
  resolveArtIdsFromNameRows,
} from '../../src/catalog/ygoproArtIds.ts';

describe('mapYgoproArtIds', () => {
  it('dedupes card_images ids in order', () => {
    const artIds = mapYgoproArtIds({
      id: 46986420,
      card_images: [{ id: 46986420 }, { id: 46986421 }, { id: 46986420 }, { id: 46986414 }],
    });
    expect(artIds).toEqual([46986420, 46986421, 46986414]);
  });

  it('falls back to passcode when card_images is empty', () => {
    expect(mapYgoproArtIds({ id: 123, card_images: [] })).toEqual([123]);
  });
});

describe('resolveArtIdsFromNameRows', () => {
  it('finds the full list when the passcode appears in another rows card_images', () => {
    const rows = [
      {
        id: 46986414,
        name: 'Dark Magician',
        card_images: [{ id: 46986414 }, { id: 46986420 }, { id: 46986421 }],
      },
    ];
    expect(resolveArtIdsFromNameRows(rows, 46986420)).toEqual([46986414, 46986420, 46986421]);
  });
});

describe('clearYgoproArtIdCache', () => {
  it('runs without throwing', () => {
    clearYgoproArtIdCache();
  });
});
