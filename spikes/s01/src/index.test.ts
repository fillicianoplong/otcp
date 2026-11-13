import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SearchIndex, optionCount } from './index.ts';
import type { TrimmedCard } from './types.ts';

const fixture = JSON.parse(
  readFileSync(new URL('../fixture/cards.json', import.meta.url), 'utf8'),
) as TrimmedCard[];

function indexOf(cards: readonly TrimmedCard[] = fixture): SearchIndex {
  return new SearchIndex(cards);
}

describe('SearchIndex', () => {
  it('finds name substrings, including queries shorter than a trigram', () => {
    const index = indexOf();
    index.search('dark');
    expect(index.collectShown({}, 10)).toEqual([53129443, 46986420]);
    index.search('d');
    expect(index.constrainCount({})).toBe(4);
    index.search('zzzz');
    expect(index.constrainCount({})).toBe(0);
  });

  it('matches rules-text tokens and passcode prefixes', () => {
    const index = indexOf();
    index.search('negate');
    expect(index.collectShown({}, 5)).toEqual([14558127]);
    index.search('dragon');
    expect(index.collectShown({}, 5)).toEqual([89631139]);
    index.search('46986420');
    expect(index.hasId(46986420)).toBe(true);
    index.search('4698');
    expect(index.hasId(46986420)).toBe(true);
    expect(index.constrainCount({})).toBe(1);
  });

  it('matches a zero-padded passcode as well as the raw id', () => {
    const index = indexOf([
      ...fixture,
      {
        id: 483,
        name: 'Short Id',
        desc: 'A short passcode.',
        type: 'Normal Monster',
        race: 'Warrior',
      },
    ]);
    index.search('00000483');
    expect(index.hasId(483)).toBe(true);
    index.search('483');
    expect(index.hasId(483)).toBe(true);
  });

  it('counts facet options with the active group removed from the intersection', () => {
    const index = indexOf();
    index.search('');
    const views = index.recount({ attribute: ['DARK'] });
    expect(optionCount(views, 'attribute', 'DARK')).toBe(2);
    expect(optionCount(views, 'attribute', 'LIGHT')).toBe(1);
    expect(optionCount(views, 'attribute', 'FIRE')).toBe(1);
    expect(optionCount(views, 'race', 'Spellcaster')).toBe(1);
    expect(optionCount(views, 'race', 'Dragon')).toBe(0);
    expect(index.constrainCount({ attribute: ['DARK'] })).toBe(2);
    expect(index.constrainCount({ attribute: ['DARK', 'LIGHT'] })).toBe(3);
  });

  it('applies AND across groups, level or link, atk and def buckets, and ban status', () => {
    const index = indexOf();
    index.search('');
    expect(index.constrainCount({ type: ['Spell Card'], race: ['Normal'] })).toBe(2);
    expect(index.constrainCount({ level: ['7', '8'] })).toBe(2);
    expect(index.constrainCount({ level: ['L4'] })).toBe(1);
    expect(index.constrainCount({ atk: ['2001-3000'] })).toBe(3);
    expect(index.constrainCount({ def: ['2001-3000'] })).toBe(2);
    expect(optionCount(index.recount({}), 'banlist', 'Unlimited')).toBe(4);
    expect(optionCount(index.recount({}), 'banlist', 'Limited')).toBe(2);
    expect(optionCount(index.recount({ banlist: ['Limited'] }), 'banlist', 'Unlimited')).toBe(4);
    expect(index.constrainCount({ archetype: ['Dark Magician'] })).toBe(1);
  });

  it('puts negative, zero, and high stats in the edge buckets', () => {
    const index = indexOf([
      {
        id: 1,
        name: 'Unknown Stat',
        desc: '',
        type: 'Effect Monster',
        race: 'Spellcaster',
        atk: -1,
        def: 0,
      },
      {
        id: 2,
        name: 'Big Stat',
        desc: '',
        type: 'Effect Monster',
        race: 'Dragon',
        atk: 4000,
        def: 1000,
      },
    ]);
    index.search('');
    expect(index.constrainCount({ atk: ['?'] })).toBe(1);
    expect(index.constrainCount({ atk: ['3001+'] })).toBe(1);
    expect(index.constrainCount({ def: ['0'] })).toBe(1);
    expect(index.constrainCount({ def: ['1-1000'] })).toBe(1);
  });

  it('reads every id when the set crosses a 32-bit word boundary', () => {
    const cards: TrimmedCard[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      name: `Card ${String(i).padStart(2, '0')}`,
      desc: i === 31 ? 'boundary token' : '',
      type: 'Normal Monster',
      race: 'Warrior',
      attribute: 'WATER',
      level: 1,
      atk: 100,
      def: 100,
    }));
    const index = new SearchIndex(cards);
    index.search('');
    const ids = index.collectShown({}, 40);
    expect(ids).toHaveLength(40);
    expect(ids[31]).toBe(31);
    expect(ids[32]).toBe(32);
    index.search('boundary');
    expect(index.collectShown({}, 5)).toEqual([31]);
  });

  it('zeroes option counts when the query matches nothing', () => {
    const index = indexOf();
    index.search('zzzz');
    expect(optionCount(index.recount({}), 'attribute', 'DARK')).toBe(0);
  });
});
