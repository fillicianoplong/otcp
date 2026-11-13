import { describe, expect, it } from 'vitest';

import {
  compareCatalogCards,
  sortCatalogEntries,
  sortCatalogTableRows,
} from '../../src/catalog/catalogTableSort.ts';
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

  it('orders cards that share a type A–Z by name', () => {
    const zeta = card({ id: 1, name: 'Zeta', type: 'Effect Monster' });
    const alpha = card({ id: 2, name: 'Alpha', type: 'Effect Monster' });
    const spellCard = card({ id: 3, name: 'Spell', type: 'Spell Card' });

    const sorted = sortCatalogTableRows(
      [zeta, spellCard, alpha],
      { column: 'cardType', direction: 'asc' },
      null,
    );

    expect(sorted.map((entry) => entry.name)).toEqual(['Alpha', 'Zeta', 'Spell']);
    expect(
      compareCatalogCards(alpha, zeta, { column: 'cardType', direction: 'asc' }, null),
    ).toBeLessThan(0);
  });

  it('keeps the name tiebreak A–Z when the primary sort is descending', () => {
    const zeta = card({ id: 1, name: 'Zeta', atk: 2000 });
    const alpha = card({ id: 2, name: 'Alpha', atk: 2000 });
    const higher = card({ id: 3, name: 'Higher', atk: 3000 });

    const sorted = sortCatalogTableRows(
      [zeta, higher, alpha],
      { column: 'atk', direction: 'desc' },
      null,
    );

    expect(sorted.map((entry) => entry.name)).toEqual(['Higher', 'Alpha', 'Zeta']);
    expect(
      compareCatalogCards(zeta, alpha, { column: 'atk', direction: 'desc' }, null),
    ).toBeGreaterThan(0);
  });

  it('sorts empty card types last in both directions and keeps the name tiebreak A–Z', () => {
    const zeta = card({ id: 1, name: 'Zeta', type: 'Effect Monster' });
    const alpha = card({ id: 2, name: 'Alpha', type: 'Effect Monster' });
    const spellCard = card({ id: 4, name: 'Spell', type: 'Spell Card' });
    const blank = card({ id: 3, name: 'Blank', type: '' });

    const ascending = sortCatalogTableRows(
      [blank, zeta, spellCard, alpha],
      { column: 'cardType', direction: 'asc' },
      null,
    );
    const descending = sortCatalogTableRows(
      [blank, zeta, spellCard, alpha],
      { column: 'cardType', direction: 'desc' },
      null,
    );

    expect(ascending.map((entry) => entry.name)).toEqual(['Alpha', 'Zeta', 'Spell', 'Blank']);
    expect(descending.map((entry) => entry.name)).toEqual(['Spell', 'Alpha', 'Zeta', 'Blank']);
  });

  it('sorts ban status with empty values last and names A–Z inside a status', () => {
    const zeta = card({
      id: 1,
      name: 'Zeta',
      banlistInfo: { banTcg: 'Limited' },
    });
    const alpha = card({
      id: 2,
      name: 'Alpha',
      banlistInfo: { banTcg: 'Limited' },
    });
    const forbidden = card({
      id: 4,
      name: 'Forbidden',
      banlistInfo: { banTcg: 'Forbidden' },
    });
    const unlimited = card({ id: 3, name: 'Unlimited' });

    const ascending = sortCatalogEntries(
      [unlimited, zeta, forbidden, alpha].map((entry) => ({ card: entry })),
      { column: 'ban', direction: 'asc' },
      'advanced',
    );
    const descending = sortCatalogTableRows(
      [unlimited, zeta, forbidden, alpha],
      { column: 'ban', direction: 'desc' },
      'advanced',
    );

    expect(ascending.map((entry) => entry.card.name)).toEqual([
      'Alpha',
      'Zeta',
      'Forbidden',
      'Unlimited',
    ]);
    expect(descending.map((entry) => entry.name)).toEqual([
      'Forbidden',
      'Alpha',
      'Zeta',
      'Unlimited',
    ]);
  });
});
