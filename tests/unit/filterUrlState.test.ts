import { describe, expect, it } from 'vitest';

import { emptyFilterState, serializeFilterState } from '../../src/catalog/filterEngine.ts';
import {
  FILTER_QUERY_KEY,
  filterStateSignature,
  readFilterStateFromParams,
  roundTripFilterQueryParam,
  writeFilterStateToParams,
} from '../../src/catalog/filterUrlState.ts';

describe('filter URL state', () => {
  it('round-trips filter state through URL search params', () => {
    const state = {
      version: 1 as const,
      facets: {
        attribute: { include: ['DARK'], exclude: ['LIGHT'] },
        monsterFrame: { include: ['Effect'], mode: 'and' as const },
      },
    };
    expect(roundTripFilterQueryParam(state)).toEqual({
      version: 1,
      facets: {
        attribute: { include: ['DARK'], exclude: ['LIGHT'] },
        monsterFrame: { include: ['Effect'] },
      },
    });
  });

  it('round-trips custom facet ranges through URL search params', () => {
    const state = {
      version: 1 as const,
      facets: {
        price: { range: { max: 5 } },
        atk: { range: { min: 1500, max: 2500 } },
      },
    };
    expect(roundTripFilterQueryParam(state)).toEqual(state);
  });

  it('omits the query key when filters are empty', () => {
    const params = new URLSearchParams({ q: 'dragon' });
    writeFilterStateToParams(params, emptyFilterState());
    expect(params.has(FILTER_QUERY_KEY)).toBe(false);
    expect(params.get('q')).toBe('dragon');
  });

  it('reads empty state when the param is missing or invalid', () => {
    expect(readFilterStateFromParams(new URLSearchParams())).toEqual(emptyFilterState());
    expect(readFilterStateFromParams(new URLSearchParams({ [FILTER_QUERY_KEY]: '{bad' }))).toEqual(
      emptyFilterState(),
    );
  });

  it('matches filterStateSignature to serialized JSON when filters are active', () => {
    const state = {
      version: 1 as const,
      facets: { attribute: { include: ['LIGHT'] } },
    };
    expect(filterStateSignature(state)).toBe(serializeFilterState(state));
  });

  it('uses an empty signature when no filters are active', () => {
    expect(filterStateSignature(emptyFilterState())).toBe('');
  });
});
