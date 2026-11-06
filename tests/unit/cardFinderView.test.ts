/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CARD_FINDER_GRID_CLASS,
  CARD_FINDER_VIEW_STORAGE_KEY,
  cardFinderGridColumnCount,
  readCardFinderViewMode,
  writeCardFinderViewMode,
} from '../../src/cardFinder/cardFinderView.ts';

describe('card finder view', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to list and stores grid for the session', () => {
    localStorage.clear();
    expect(readCardFinderViewMode()).toBe('list');
    writeCardFinderViewMode('grid');
    expect(localStorage.getItem(CARD_FINDER_VIEW_STORAGE_KEY)).toBe('grid');
    expect(readCardFinderViewMode()).toBe('grid');
    writeCardFinderViewMode('list');
    expect(readCardFinderViewMode()).toBe('list');
  });

  it('ignores an unknown stored value', () => {
    localStorage.setItem(CARD_FINDER_VIEW_STORAGE_KEY, 'table');
    expect(readCardFinderViewMode()).toBe('list');
  });

  it('reads list when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readCardFinderViewMode()).toBe('list');
  });

  it('uses three columns from 340px and two below that', () => {
    expect(cardFinderGridColumnCount(320)).toBe(2);
    expect(cardFinderGridColumnCount(339)).toBe(2);
    expect(cardFinderGridColumnCount(340)).toBe(3);
    expect(cardFinderGridColumnCount(390)).toBe(3);
    expect(cardFinderGridColumnCount(1280)).toBe(3);
    expect(CARD_FINDER_GRID_CLASS).toContain('grid-cols-2');
    expect(CARD_FINDER_GRID_CLASS).toContain('min-[340px]:grid-cols-3');
    expect(CARD_FINDER_GRID_CLASS).toContain('min-w-0');
    expect(CARD_FINDER_GRID_CLASS).not.toContain('min-w-[');
  });
});
