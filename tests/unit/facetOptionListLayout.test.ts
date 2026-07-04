import { describe, expect, it } from 'vitest';

import {
  FACET_COLLAPSED_VISIBLE_COUNT,
  FACET_LONG_GROUP_OPTION_THRESHOLD,
  facetOptionListShowsSearch,
  facetOptionListUsesInnerScroll,
  facetOptionShowMoreLess,
  facetOptionVisibleCount,
  isLongFacetOptionList,
} from '../../src/catalog/facetOptionListLayout.ts';

describe('isLongFacetOptionList', () => {
  it('treats set and archetype as long regardless of count', () => {
    expect(isLongFacetOptionList('set', 3)).toBe(true);
    expect(isLongFacetOptionList('archetype', 1)).toBe(true);
  });

  it('uses the option threshold for category (cardType)', () => {
    expect(isLongFacetOptionList('cardType', FACET_LONG_GROUP_OPTION_THRESHOLD - 1)).toBe(false);
    expect(isLongFacetOptionList('cardType', FACET_LONG_GROUP_OPTION_THRESHOLD)).toBe(true);
  });

  it('uses the option threshold for other fields', () => {
    expect(isLongFacetOptionList('attribute', FACET_LONG_GROUP_OPTION_THRESHOLD - 1)).toBe(false);
    expect(isLongFacetOptionList('attribute', FACET_LONG_GROUP_OPTION_THRESHOLD)).toBe(true);
    expect(isLongFacetOptionList('race', 20)).toBe(true);
  });
});

describe('facet option list expand/collapse', () => {
  it('shows eight options when collapsed', () => {
    expect(facetOptionVisibleCount(20, false)).toBe(FACET_COLLAPSED_VISIBLE_COUNT);
    expect(facetOptionVisibleCount(5, false)).toBe(5);
  });

  it('shows the full filtered list when expanded', () => {
    expect(facetOptionVisibleCount(20, true)).toBe(20);
  });

  it('offers Show more and Show less at the collapsed boundary', () => {
    expect(facetOptionShowMoreLess(FACET_COLLAPSED_VISIBLE_COUNT, false)).toBe(null);
    expect(facetOptionShowMoreLess(FACET_COLLAPSED_VISIBLE_COUNT + 1, false)).toBe('more');
    expect(facetOptionShowMoreLess(FACET_COLLAPSED_VISIBLE_COUNT + 1, true)).toBe('less');
  });
});

describe('facetOptionListUsesInnerScroll', () => {
  it('never scrolls short groups', () => {
    expect(facetOptionListUsesInnerScroll(false, false)).toBe(false);
    expect(facetOptionListUsesInnerScroll(false, true)).toBe(false);
  });

  it('scrolls long groups only when expanded', () => {
    expect(facetOptionListUsesInnerScroll(true, false)).toBe(false);
    expect(facetOptionListUsesInnerScroll(true, true)).toBe(true);
  });

  it('does not cap expanded category when option count is below the long threshold', () => {
    const shortCategory = isLongFacetOptionList('cardType', FACET_LONG_GROUP_OPTION_THRESHOLD - 1);
    expect(shortCategory).toBe(false);
    expect(facetOptionListUsesInnerScroll(shortCategory, true)).toBe(false);
  });
});

describe('facetOptionListShowsSearch', () => {
  it('shows search only for long groups', () => {
    expect(facetOptionListShowsSearch(false)).toBe(false);
    expect(facetOptionListShowsSearch(true)).toBe(true);
  });
});
