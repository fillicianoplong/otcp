import { expect, test } from '@playwright/test';

test.describe('Grid view on Search page', () => {
  test('shows at least three tiles per row at 390px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/otcp/search');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });

    const grid = page.locator('section ul.grid').first();
    await expect(grid).toBeVisible();

    const firstRowCount = await grid.locator('> li').evaluateAll((items) => {
      if (items.length === 0) return 0;
      const rowTop = items[0]!.getBoundingClientRect().top;
      return items.filter((item) => Math.abs(item.getBoundingClientRect().top - rowTop) < 2).length;
    });

    expect(firstRowCount).toBeGreaterThanOrEqual(3);
  });
});
