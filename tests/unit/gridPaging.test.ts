import { describe, expect, it } from 'vitest';

import {
  CATALOG_GRID_PAGE_SIZE,
  gridHasMore,
  initialGridVisibleCount,
  nextGridVisibleCount,
  sliceGridCards,
} from '../../src/catalog/gridPaging.ts';

describe('gridPaging', () => {
  it('shows the first page up to the page size', () => {
    expect(initialGridVisibleCount(0)).toBe(0);
    expect(initialGridVisibleCount(10, CATALOG_GRID_PAGE_SIZE)).toBe(10);
    expect(initialGridVisibleCount(14547, CATALOG_GRID_PAGE_SIZE)).toBe(CATALOG_GRID_PAGE_SIZE);
  });

  it('loads the next page without exceeding the match total', () => {
    expect(nextGridVisibleCount(48, 14547)).toBe(96);
    expect(nextGridVisibleCount(14500, 14547)).toBe(14547);
    expect(nextGridVisibleCount(14547, 14547)).toBe(14547);
  });

  it('slices rendered cards and reports whether more remain', () => {
    const cards = Array.from({ length: 100 }, (_, index) => index);
    expect(sliceGridCards(cards, 48)).toHaveLength(48);
    expect(sliceGridCards(cards, 0)).toEqual([]);
    expect(gridHasMore(48, 100)).toBe(true);
    expect(gridHasMore(100, 100)).toBe(false);
    expect(gridHasMore(0, 100)).toBe(false);
  });
});
