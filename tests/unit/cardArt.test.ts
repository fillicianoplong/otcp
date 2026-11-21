import { describe, expect, it } from 'vitest';

import {
  artIdsForSets,
  catalogLargeImageUrl,
  catalogSmallImageUrl,
  expandCardsToArtTiles,
  resolveArtIds,
  setFilterNames,
} from '../../src/catalog/cardArt.ts';
import { emptyFilterState } from '../../src/catalog/filterEngine.ts';
import {
  artIdsPrintedInSets,
  isSetRowMarkedForSelectedArt,
} from '../../src/catalog/setArtPrintings.ts';
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

const darkMagicianGirl: YugiohCard = {
  ...multiArtCard,
  id: 38033121,
  name: 'Dark Magician Girl',
  type: 'Effect Monster',
  artIds: [38033121, 38033122, 38033123, 38033124, 38033125, 38033126],
};

describe('Set filter artwork', () => {
  it('shows only the art printed in the selected set', () => {
    const tiles = expandCardsToArtTiles([darkMagicianGirl], ["Magician's Force"]);
    expect(tiles.map((tile) => tile.imageId)).toEqual([38033121]);

    const lostArt = expandCardsToArtTiles([darkMagicianGirl], ['The Lost Art Promotion 2020 G']);
    expect(lostArt.map((tile) => tile.imageId)).toEqual([38033124]);
  });

  it('shows each art once when several selected sets print different arts', () => {
    expect(
      artIdsForSets(darkMagicianGirl, [
        "Magician's Force",
        'Magnificent Mavens',
        'The Lost Art Promotion 2020 G',
      ]),
    ).toEqual([38033121, 38033124]);
  });

  it('finds the printings when the catalog id is another artwork of the card', () => {
    const darkMagician: YugiohCard = {
      ...multiArtCard,
      artIds: [46986420, 36996508, 46986414, 46986421],
    };
    expect(artIdsForSets(darkMagician, ['Legend of Blue Eyes White Dragon'])).toEqual([36996508]);
    expect(artIdsForSets(darkMagician, ['Starter Deck: Yugi'])).toEqual([46986414]);
  });

  it('falls back to the default art when the printing is not mapped', () => {
    expect(artIdsForSets(darkMagicianGirl, ['Duelist Pack: Yugi'])).toEqual([38033121]);
    expect(artIdsForSets(multiArtCard, ['Dark Beginning 1'])).toEqual([46986420]);
  });

  it('keeps every artwork when no Set filter is active', () => {
    expect(expandCardsToArtTiles([darkMagicianGirl], [])).toHaveLength(6);
  });

  it('reads the selected sets from the filter state', () => {
    expect(setFilterNames(emptyFilterState())).toEqual([]);
    expect(
      setFilterNames({
        ...emptyFilterState(),
        facets: { set: { include: ["Magician's Force"] } },
      }),
    ).toEqual(["Magician's Force"]);
    expect(
      setFilterNames({ ...emptyFilterState(), facets: { set: { exclude: ['Premium Gold'] } } }),
    ).toEqual([]);
  });

  it('marks the set rows that print the selected art', () => {
    expect(artIdsPrintedInSets(38033121, new Set(['Premium Gold']))).toEqual([]);
    expect(isSetRowMarkedForSelectedArt(38033121, 38033124, 'LART-EN019')).toBe(true);
    expect(isSetRowMarkedForSelectedArt(38033121, 38033121, 'LART-EN019')).toBe(false);
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
