import { expect, test } from '@playwright/test';

import { ensureGridTileCount, SEARCH_PAGE } from './helpers/searchAllArt.ts';
import { SAMPLE_SEARCH_TILE_COUNT_LABEL } from './helpers/searchExpectedCounts.ts';

test.describe('Grid view on Search page', () => {
  test('shows at least three tiles per row at 390px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SEARCH_PAGE);
    await expect(page.getByText(SAMPLE_SEARCH_TILE_COUNT_LABEL)).toBeVisible({ timeout: 15_000 });

    const grid = page.locator('section ul.grid').first();
    await expect(grid).toBeVisible();
    await ensureGridTileCount(page, 3);

    const firstRowCount = await grid.locator('> li').evaluateAll((items) => {
      if (items.length === 0) return 0;
      const rowTop = items[0]!.getBoundingClientRect().top;
      return items.filter((item) => Math.abs(item.getBoundingClientRect().top - rowTop) < 2).length;
    });

    expect(firstRowCount).toBeGreaterThanOrEqual(3);
  });

  test('shows three tiles per row in the search section at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(SEARCH_PAGE);
    await expect(page.getByText(SAMPLE_SEARCH_TILE_COUNT_LABEL)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Grid view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const grid = page.locator('section ul.grid').first();
    await expect(grid).toBeVisible();
    await ensureGridTileCount(page, 3);

    const firstRowCount = await grid.locator('> li').evaluateAll((items) => {
      if (items.length === 0) return 0;
      const rowTop = items[0]!.getBoundingClientRect().top;
      return items.filter((item) => Math.abs(item.getBoundingClientRect().top - rowTop) < 2).length;
    });

    expect(firstRowCount).toBe(3);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
