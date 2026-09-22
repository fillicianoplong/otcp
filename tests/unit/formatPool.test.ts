import { describe, expect, it } from 'vitest';

import { isCardInFormatPool } from '../../src/format/formatPool.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import type { SetIndex } from '../../src/shared/schema/setIndex.ts';

const setIndex: SetIndex = {
  'Dark Beginning 2': { tcgDate: '2005-03-08' },
  'Cybernetic Revolution': { tcgDate: '2005-08-17' },
  'Shadow of Infinity': { tcgDate: '2005-10-20' },
  'Generation Force': { tcgDate: '2011-08-16' },
  'Photon Shockwave': { tcgDate: '2011-11-15' },
};

function cardInSet(id: number, name: string, setName: string): YugiohCard {
  return {
    schemaVersion: '1.0.0',
    id,
    name,
    type: 'Monster',
    text: '',
    images: { small: '/s.webp', large: '/l.webp' },
    sets: [{ setName, setCode: 'DB2', setRarity: 'Common' }],
    race: 'Warrior',
  };
}

describe('formatPool tcg-earliest-on-or-before', () => {
  it('includes a DB2 card in GOAT and excludes post-August 2005 sets', () => {
    const inPool = cardInSet(1, 'In pool', 'Dark Beginning 2');
    const outOfPool = cardInSet(2, 'Out of pool', 'Shadow of Infinity');
    expect(isCardInFormatPool(inPool, 'goat', setIndex)).toBe(true);
    expect(isCardInFormatPool(outOfPool, 'goat', setIndex)).toBe(false);
  });

  it('includes Generation Force in Tengu and excludes later sets', () => {
    const inPool = cardInSet(3, 'GF card', 'Generation Force');
    const outOfPool = cardInSet(4, 'Later set', 'Photon Shockwave');
    expect(isCardInFormatPool(inPool, 'tengu', setIndex)).toBe(true);
    expect(isCardInFormatPool(outOfPool, 'tengu', setIndex)).toBe(false);
  });

  it('excludes cards with no resolvable earliest TCG date from historical pools', () => {
    const unknown: YugiohCard = {
      ...cardInSet(5, 'Unknown date', 'Missing from index'),
      sets: [{ setName: 'Missing from index', setCode: 'X', setRarity: 'Common' }],
    };
    expect(isCardInFormatPool(unknown, 'goat', setIndex)).toBe(false);
  });

  it('keeps the full TCG pool for Advanced', () => {
    const future = cardInSet(6, 'Future', 'Photon Shockwave');
    expect(isCardInFormatPool(future, 'advanced', setIndex)).toBe(true);
  });
});
