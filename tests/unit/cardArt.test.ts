import { beforeAll, describe, expect, it } from 'vitest';

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
  loadSetArtPrintings,
  setSetArtPrintingsData,
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
  beforeAll(async () => {
    await loadSetArtPrintings();
  });

  it('shows only the art printed in the selected set', () => {
    const tiles = expandCardsToArtTiles([darkMagicianGirl], ["Magician's Force"]);
    expect(tiles.map((tile) => tile.imageId)).toEqual([38033121]);

    const lostArt = expandCardsToArtTiles([darkMagicianGirl], ['The Lost Art Promotion 2020 G']);
    expect(lostArt.map((tile) => tile.imageId)).toEqual([38033124]);

    expect(artIdsForSets(darkMagicianGirl, ['Duelist Pack: Yugi'])).toEqual([38033122]);
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

  it('shows every art a set printed when it has more than one', () => {
    expect(artIdsForSets(darkMagicianGirl, ['Quarter Century Bonanza'])).toEqual([
      38033123, 38033125,
    ]);
  });

  it('finds the printings when the catalog id is another artwork of the card', () => {
    const darkMagician: YugiohCard = {
      ...multiArtCard,
      id: 46986414,
      passcode: 46986414,
      artIds: [46986414, 46986415, 46986416, 46986420],
    };
    expect(artIdsForSets(darkMagician, ['Legend of Blue Eyes White Dragon'])).toEqual([46986415]);
    expect(artIdsForSets(darkMagician, ['Starter Deck: Yugi'])).toEqual([46986414]);
    expect(artIdsForSets(darkMagician, ['Dark Beginning 1'])).toEqual([46986416]);
  });

  it('maps every printing of the classic multi-art cards', () => {
    const blueEyes: YugiohCard = {
      ...multiArtCard,
      id: 89631139,
      name: 'Blue-Eyes White Dragon',
      artIds: [89631139, 89631140, 89631141],
    };
    expect(artIdsForSets(blueEyes, ['Legend of Blue Eyes White Dragon'])).toEqual([89631140]);
    expect(artIdsForSets(blueEyes, ['Starter Deck: Kaiba'])).toEqual([89631139]);
    expect(artIdsForSets(blueEyes, ['Legendary Collection'])).toEqual([89631141]);
  });

  it('falls back to the default art when the printing has no matching art', () => {
    expect(artIdsForSets(darkMagicianGirl, ['Battles of Legend: Glorious Gallery'])).toEqual([
      38033121,
    ]);
    expect(artIdsForSets(multiArtCard, ['Premium Gold'])).toEqual([46986420]);
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
    expect(artIdsPrintedInSets(38033121, new Set(['Premium Gold']))).toEqual([38033121]);
    expect(isSetRowMarkedForSelectedArt(38033121, 38033124, 'LART-EN019')).toBe(true);
    expect(isSetRowMarkedForSelectedArt(38033121, 38033121, 'LART-EN019')).toBe(false);
  });
});

describe('Set art printings data', () => {
  it('narrows a set row by rarity when the rarities used different artworks', () => {
    setSetArtPrintingsData({
      sets: ['Test Set'],
      rarities: ['Common', 'Secret Rare'],
      cards: {
        '1': [
          ['TST-EN001', 0, 1, 0],
          ['TST-EN001', 0, 2, 1],
        ],
      },
    });
    expect(isSetRowMarkedForSelectedArt(1, 2, 'TST-EN001', 'Secret Rare')).toBe(true);
    expect(isSetRowMarkedForSelectedArt(1, 2, 'TST-EN001', 'Common')).toBe(false);
    expect(isSetRowMarkedForSelectedArt(1, 2, 'TST-EN001')).toBe(true);
    expect(artIdsPrintedInSets(1, new Set(['Test Set']))).toEqual([1, 2]);
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
