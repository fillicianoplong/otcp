import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { SearchIndex } from '../../src/search/SearchIndex.ts';
import type { YugiohCard } from '../../src/shared/schema/card.ts';
import sampleDataset from '../../public/data/datasets/sample-dev.json';

function card(partial: YugiohCard): YugiohCard {
  return partial;
}

const sampleCards = sampleDataset.cards as YugiohCard[];

describe('SearchIndex', () => {
  it('finds a unique name substring from the sample dataset', () => {
    const index = new SearchIndex(sampleCards);
    const result = index.query('magician');
    expect(result.count).toBe(1);
    expect(result.ids).toEqual([46986420]);
  });

  it('ranks exact and prefix name matches ahead of substring-only matches', () => {
    const index = new SearchIndex([
      card({
        ...sampleCards[0],
        id: 1,
        name: 'Dark',
        passcode: 1,
      }),
      card({
        ...sampleCards[0],
        id: 2,
        name: 'Darkness Falls',
        passcode: 2,
      }),
      card({
        ...sampleCards[0],
        id: 3,
        name: 'Shadow Darkling',
        passcode: 3,
      }),
    ]);

    const result = index.query('dark');
    expect(result.ids).toEqual([1, 2, 3]);
  });

  it('finds cards by passcode and zero-padded passcode', () => {
    const index = new SearchIndex([
      card({
        ...sampleCards[1],
        id: 483,
        name: 'Short Passcode',
        passcode: 483,
      }),
    ]);
    expect(index.query('483').ids).toEqual([483]);
    expect(index.query('00000483').ids).toEqual([483]);
  });

  it('matches names without regard to case or accents', () => {
    const index = new SearchIndex([
      card({
        ...sampleCards[0],
        id: 99,
        name: 'José the Test',
        passcode: 99,
      }),
    ]);
    const result = index.query('jose');
    expect(result.count).toBe(1);
    expect(result.ids).toEqual([99]);
  });

  it('returns no matches for nonsense queries', () => {
    const index = new SearchIndex(sampleCards);
    expect(index.query('zzzqqq').count).toBe(0);
    expect(index.query('zzzqqq').ids).toEqual([]);
  });

  it('includes short queries below trigram length', () => {
    const index = new SearchIndex(sampleCards);
    expect(index.query('d').count).toBeGreaterThan(0);
  });
});

describe('SearchIndex fixture file', () => {
  it('loads the published sample dataset JSON', () => {
    const raw = readFileSync(
      new URL('../../public/data/datasets/sample-dev.json', import.meta.url),
      'utf8',
    );
    expect(raw.includes('Dark Magician')).toBe(true);
  });
});
