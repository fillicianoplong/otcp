import { describe, expect, it } from 'vitest';

import { catalogGridColumnCount } from '../../src/catalog/catalogGridLayout.ts';

describe('catalogGridLayout', () => {
  it('uses at least three columns on phone widths 360–430 CSS px', () => {
    for (const width of [360, 390, 430]) {
      expect(catalogGridColumnCount(width)).toBeGreaterThanOrEqual(3);
    }
  });

  it('scales column counts up on tablet and desktop', () => {
    expect(catalogGridColumnCount(639)).toBe(3);
    expect(catalogGridColumnCount(640)).toBe(4);
    expect(catalogGridColumnCount(767)).toBe(4);
    expect(catalogGridColumnCount(768)).toBe(5);
    expect(catalogGridColumnCount(1023)).toBe(5);
    expect(catalogGridColumnCount(1024)).toBe(6);
    expect(catalogGridColumnCount(1440)).toBe(6);
  });
});
