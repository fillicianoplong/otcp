/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CARD_FINDER_VIEW_STORAGE_KEY,
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

  it('keeps the stored library view separate from the deck tile size', () => {
    expect(CARD_FINDER_VIEW_STORAGE_KEY).not.toBe('otcp:view:deck-zones');
  });
});
