import { describe, expect, it } from 'vitest';

import {
  CATALOG_GRID_CLASS,
  CATALOG_GRID_DESKTOP_MIN_WIDTH_PX,
  catalogGridColumnCount,
} from '../../src/catalog/catalogGridLayout.ts';

describe('catalogGridLayout', () => {
  it('uses at least three columns on phone widths 360–430 CSS px', () => {
    for (const width of [360, 390, 430]) {
      expect(catalogGridColumnCount(width)).toBeGreaterThanOrEqual(3);
    }
  });

  it('uses two columns below 360px so a narrow phone does not overflow', () => {
    expect(catalogGridColumnCount(320)).toBe(2);
    expect(catalogGridColumnCount(359)).toBe(2);
  });

  it('scales column counts up on wider phones and tablets', () => {
    expect(catalogGridColumnCount(639)).toBe(3);
    expect(catalogGridColumnCount(640)).toBe(4);
    expect(catalogGridColumnCount(767)).toBe(4);
    expect(catalogGridColumnCount(768)).toBe(5);
    expect(catalogGridColumnCount(1023)).toBe(5);
  });

  it('keeps the search section at three columns on a typical desktop', () => {
    expect(CATALOG_GRID_DESKTOP_MIN_WIDTH_PX).toBe(1024);
    for (const width of [1024, 1280, 1400, 1920]) {
      expect(catalogGridColumnCount(width)).toBe(3);
    }
    expect(CATALOG_GRID_CLASS).toContain('lg:grid-cols-3');
    expect(CATALOG_GRID_CLASS).toContain('min-[360px]:grid-cols-3');
    expect(CATALOG_GRID_CLASS).toContain('grid-cols-2');
    expect(CATALOG_GRID_CLASS).not.toContain('grid-cols-6');
    expect(CATALOG_GRID_CLASS).not.toContain('grid-cols-8');
  });
});
