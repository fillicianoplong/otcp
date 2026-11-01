import { describe, expect, it } from 'vitest';

import { emptyFilterState } from '../../src/catalog/filterEngine.ts';
import {
  cycleFacetValue,
  removeFilterChip,
  setFacetRange,
} from '../../src/catalog/filterSelection.ts';
import { filterStateToChips, roundTripFilterQueryParam } from '../../src/catalog/filterUrlState.ts';

describe('cycleFacetValue', () => {
  it('cycles off → include → exclude → off when exclude is allowed', () => {
    let state = emptyFilterState();
    state = cycleFacetValue(state, 'attribute', 'DARK', true);
    expect(state.facets.attribute?.include).toEqual(['DARK']);

    state = cycleFacetValue(state, 'attribute', 'DARK', true);
    expect(state.facets.attribute?.exclude).toEqual(['DARK']);
    expect(state.facets.attribute?.include).toBeUndefined();

    state = cycleFacetValue(state, 'attribute', 'DARK', true);
    expect(state.facets.attribute).toBeUndefined();
  });

  it('cycles off → include → off when exclude is not allowed', () => {
    let state = emptyFilterState();
    state = cycleFacetValue(state, 'hasImage', 'yes', false);
    expect(state.facets.hasImage?.include).toEqual(['yes']);

    state = cycleFacetValue(state, 'hasImage', 'yes', false);
    expect(state.facets.hasImage).toBeUndefined();
  });

  it('round-trips excluded values through the URL', () => {
    const state = {
      version: 1 as const,
      facets: { attribute: { exclude: ['LIGHT'] } },
    };
    expect(roundTripFilterQueryParam(state)).toEqual(state);
  });
});

describe('filterStateToChips', () => {
  it('labels include and exclude chips from the value', () => {
    const chips = filterStateToChips({
      version: 1,
      facets: {
        attribute: { include: ['DARK'], exclude: ['LIGHT'] },
      },
    });
    expect(chips.map((chip) => chip.label)).toEqual(['DARK', 'Not LIGHT']);
  });

  it('includes a chip for custom numeric ranges', () => {
    const chips = filterStateToChips({
      version: 1,
      facets: { atk: { range: { min: 1500, max: 2500 } } },
    });
    expect(chips).toHaveLength(1);
    expect(chips[0]?.label).toBe('ATK 1500–2500');
    expect(chips[0]?.kind).toBe('range');
  });
});

describe('setFacetRange', () => {
  it('round-trips through the URL and clears via chip removal', () => {
    let state = setFacetRange(emptyFilterState(), 'atk', { min: 1500, max: 2500 });
    expect(roundTripFilterQueryParam(state).facets.atk?.range).toEqual({
      min: 1500,
      max: 2500,
    });
    state = removeFilterChip(state, { fieldId: 'atk', kind: 'range' });
    expect(state.facets.atk).toBeUndefined();
  });
});
