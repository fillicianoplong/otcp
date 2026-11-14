import { describe, expect, it } from 'vitest';

import { placeAnchoredMenu } from './menuPosition.ts';

const gap = 4;
const viewport = { width: 390, height: 844 };

describe('placeAnchoredMenu', () => {
  it('sits one gap below the button with the right edges aligned', () => {
    const placed = placeAnchoredMenu(
      { top: 120, right: 360, bottom: 152, left: 328 },
      { width: 192, height: 240 },
      viewport,
      gap,
    );
    expect(placed.placement).toBe('below');
    expect(placed.top).toBe(156);
    expect(placed.left).toBe(168);
    expect(placed.left + 192).toBe(360);
  });

  it('shifts left when the menu would leave the right edge', () => {
    const placed = placeAnchoredMenu(
      { top: 120, right: 388, bottom: 152, left: 356 },
      { width: 200, height: 80 },
      viewport,
      gap,
    );
    expect(placed.left + 200).toBeLessThanOrEqual(viewport.width - gap);
    expect(placed.left).toBe(viewport.width - gap - 200);
  });

  it('stays inside the left edge', () => {
    const placed = placeAnchoredMenu(
      { top: 40, right: 36, bottom: 72, left: 4 },
      { width: 192, height: 80 },
      viewport,
      gap,
    );
    expect(placed.left).toBe(gap);
  });

  it('flips above the button when there is more room there', () => {
    const placed = placeAnchoredMenu(
      { top: 700, right: 360, bottom: 732, left: 328 },
      { width: 192, height: 200 },
      viewport,
      gap,
    );
    expect(placed.placement).toBe('above');
    expect(placed.top).toBe(700 - gap - 200);
    expect(placed.top).toBeGreaterThanOrEqual(gap);
  });
});
