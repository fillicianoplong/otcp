import { describe, expect, it } from 'vitest';

import {
  compareFacetOptionValues,
  formatFacetOptionLabel,
  sortFacetOptionsForDisplay,
} from '../../src/catalog/facetOptionOrdering.ts';

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
});
