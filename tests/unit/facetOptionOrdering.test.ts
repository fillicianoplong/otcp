import { describe, expect, it } from 'vitest';

import {
  compareFacetOptionValues,
  compareSetFacetOptionValues,
  formatFacetOptionLabel,
  sortFacetOptionsForDisplay,
} from '../../src/catalog/facetOptionOrdering.ts';
import type { SetIndex } from '../../src/shared/schema/setIndex.ts';

const sampleIndex: SetIndex = {
  'Phantom Nightmare': { tcgDate: '2024-02-09', numOfCards: 101 },
  'Maximum Crisis': { tcgDate: '2017-05-05', numOfCards: 100 },
  'Metal Raiders': { tcgDate: '2002-06-26', numOfCards: 140 },
  'Starter Deck: Yugi': { tcgDate: '2002-03-08', numOfCards: 50 },
  'Undated Promo': { numOfCards: 1 },
};

describe('facetOptionOrdering', () => {
  it('orders level facet tokens by kind then numeric rank', () => {
    const values = [
      'Level-10',
      'Level-2',
      'Rank-4',
      'Link-3',
      'Level-0',
      'Level-13',
      'Rank-0',
      'Link-1',
    ];
    const sorted = [...values].sort((a, b) => compareFacetOptionValues('level', a, b));
    expect(sorted).toEqual([
      'Level-0',
      'Level-2',
      'Level-10',
      'Level-13',
      'Rank-0',
      'Rank-4',
      'Link-1',
      'Link-3',
    ]);
  });

  it('formats level labels with a space instead of a hyphen', () => {
    expect(formatFacetOptionLabel('level', 'Level-4')).toBe('Level 4');
    expect(formatFacetOptionLabel('level', 'Rank-4')).toBe('Rank 4');
    expect(formatFacetOptionLabel('level', 'Link-3')).toBe('Link 3');
  });

  it('sorts stat buckets in ascending bucket order', () => {
    const options = sortFacetOptionsForDisplay('atk', [
      { value: '3001+', count: 1 },
      { value: '?', count: 2 },
      { value: '1-1000', count: 3 },
    ]);
    expect(options.map((opt) => opt.value)).toEqual(['?', '1-1000', '3001+']);
  });

  it('orders set facet options newest first when an index is present', () => {
    const options = sortFacetOptionsForDisplay(
      'set',
      [
        { value: 'Metal Raiders', count: 3 },
        { value: 'Maximum Crisis', count: 2 },
        { value: 'Phantom Nightmare', count: 1 },
      ],
      { setIndex: sampleIndex },
    );
    expect(options.map((opt) => opt.value)).toEqual([
      'Phantom Nightmare',
      'Maximum Crisis',
      'Metal Raiders',
    ]);
  });

  it('places undated sets after dated sets and sorts them by name', () => {
    const options = sortFacetOptionsForDisplay(
      'set',
      [
        { value: 'Undated Promo', count: 1 },
        { value: 'Metal Raiders', count: 2 },
        { value: 'ZZZ Undated', count: 1 },
      ],
      { setIndex: sampleIndex },
    );
    expect(options.map((opt) => opt.value)).toEqual([
      'Metal Raiders',
      'Undated Promo',
      'ZZZ Undated',
    ]);
  });

  it('falls back to A–Z when no set index is published', () => {
    const options = sortFacetOptionsForDisplay(
      'set',
      [
        { value: 'Metal Raiders', count: 3 },
        { value: 'Maximum Crisis', count: 2 },
      ],
      { setIndex: null },
    );
    expect(options.map((opt) => opt.value)).toEqual(['Maximum Crisis', 'Metal Raiders']);
  });

  it('compareSetFacetOptionValues breaks ties on set name', () => {
    expect(
      compareSetFacetOptionValues('Starter Deck: Yugi', 'Starter Deck: Yugi', sampleIndex),
    ).toBe(0);
    expect(
      compareSetFacetOptionValues('Metal Raiders', 'Maximum Crisis', sampleIndex),
    ).toBeGreaterThan(0);
  });
});
