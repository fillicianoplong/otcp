import { describe, expect, it } from 'vitest';

import {
  mergeSearchScrollRestore,
  parseSearchScrollRestore,
  SEARCH_SCROLL_STATE_KEY,
  withoutSearchScrollRestore,
} from '../../src/catalog/searchScrollRestore.ts';

describe('searchScrollRestore', () => {
  it('parses restore data when the saved query matches', () => {
    const state = {
      [SEARCH_SCROLL_STATE_KEY]: { loadedCount: 96, scrollY: 420, query: 'dragon' },
    };
    expect(parseSearchScrollRestore(state, 'dragon')).toEqual({
      loadedCount: 96,
      scrollY: 420,
      query: 'dragon',
      filtersKey: '',
    });
    expect(parseSearchScrollRestore(state, 'magician')).toBeNull();
  });

  it('merges and removes restore data on route state', () => {
    const merged = mergeSearchScrollRestore(
      { other: true },
      { loadedCount: 1, scrollY: 0, query: '' },
    );
    expect(merged[SEARCH_SCROLL_STATE_KEY]).toEqual({ loadedCount: 1, scrollY: 0, query: '' });
    expect(withoutSearchScrollRestore(merged)).toEqual({ other: true });
  });

  it('rejects invalid restore payloads', () => {
    expect(
      parseSearchScrollRestore(
        { [SEARCH_SCROLL_STATE_KEY]: { loadedCount: -1, scrollY: 0, query: '' } },
        '',
      ),
    ).toBeNull();
  });
});
