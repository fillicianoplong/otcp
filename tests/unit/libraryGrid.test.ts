import { describe, expect, it } from 'vitest';

import { libraryGridColumnCount } from '../../src/cardFinder/libraryGrid.ts';

describe('library grid columns', () => {
  it('uses four columns in the desktop side search', () => {
    expect(libraryGridColumnCount(0)).toBe(4);
    expect(libraryGridColumnCount(260)).toBe(4);
    expect(libraryGridColumnCount(374)).toBe(4);
  });

  it('uses four columns in a phone-width Add cards panel', () => {
    expect(libraryGridColumnCount(0, 4)).toBe(4);
    expect(libraryGridColumnCount(336, 4)).toBe(4);
    expect(libraryGridColumnCount(364, 4)).toBe(4);
    expect(libraryGridColumnCount(406, 4)).toBe(4);
  });

  it('drops columns on a narrow panel so the tiles stay at least 56px', () => {
    expect(libraryGridColumnCount(200)).toBe(3);
    expect(libraryGridColumnCount(140)).toBe(2);
    expect(libraryGridColumnCount(200, 4)).toBe(3);
  });
});
