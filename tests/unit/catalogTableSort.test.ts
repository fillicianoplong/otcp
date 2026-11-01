import { describe, expect, it } from 'vitest';

import { sortCatalogTableRows } from '../../src/catalog/catalogTableSort.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import monster from '../fixtures/schema/monster-normal.json';
import spell from '../fixtures/schema/spell.json';

function card(partial: Partial<YugiohCard> & Pick<YugiohCard, 'id' | 'name'>): YugiohCard {
  return {
    ...(monster as YugiohCard),
    ...partial,
  };
}

describe('catalogTableSort', () => {
  it('sorts ATK numerically ascending with missing values last', () => {
    const high = card({ id: 1, name: 'High', atk: 3000 });
    const low = card({ id: 2, name: 'Low', atk: 500 });
    const missing = card({ id: 3, name: 'Missing', atk: undefined });
    const spellCard = { ...(spell as YugiohCard), id: 4, name: 'Spell' };

    const sorted = sortCatalogTableRows(
      [high, missing, spellCard, low],
      { column: 'atk', direction: 'asc' },
      null,
    );

    expect(sorted.map((entry) => entry.name)).toEqual(['Low', 'High', 'Missing', 'Spell']);
  });

  it('sorts ATK descending with missing values still last', () => {
    const high = card({ id: 1, name: 'High', atk: 3000 });
    const low = card({ id: 2, name: 'Low', atk: 500 });
    const missing = card({ id: 3, name: 'Missing', atk: undefined });

    const sorted = sortCatalogTableRows(
      [low, missing, high],
      { column: 'atk', direction: 'desc' },
      null,
    );

    expect(sorted.map((entry) => entry.name)).toEqual(['High', 'Low', 'Missing']);
  });

  it('sorts price numerically', () => {
    const cheap = card({ id: 1, name: 'Cheap', prices: { tcgplayer: 1.25 } });
    const pricey = card({ id: 2, name: 'Pricey', prices: { tcgplayer: 99.5 } });
    const none = card({ id: 3, name: 'None', prices: { tcgplayer: 0 } });

    const sorted = sortCatalogTableRows(
      [pricey, none, cheap],
      { column: 'price', direction: 'asc' },
      null,
    );

    expect(sorted.map((entry) => entry.name)).toEqual(['Cheap', 'Pricey', 'None']);
  });

  it('sorts level numerically with missing values last', () => {
    const high = card({ id: 1, name: 'High', level: 8 });
    const low = card({ id: 2, name: 'Low', level: 2 });
    const missing = card({ id: 3, name: 'Missing', level: undefined });
    const spellCard = { ...(spell as YugiohCard), id: 4, name: 'Spell' };

    const sorted = sortCatalogTableRows(
      [high, missing, spellCard, low],
      { column: 'level', direction: 'asc' },
      null,
    );

    expect(sorted.map((entry) => entry.name)).toEqual(['Low', 'High', 'Missing', 'Spell']);
  });
});
