import { expect, type Locator, type Page } from '@playwright/test';

export const SEARCH_PAGE = '/otcp/search';

export function searchPath(query = ''): string {
  if (query.length === 0) return '/otcp/search';
  const params = new URLSearchParams({ q: query });
  return `/otcp/search?${params.toString()}`;
}

/**
 * E2e preview uses VITE_CATALOG_GRID_PAGE_SIZE=1. Desktop tiles are tall, so a
 * card past the first row is not mounted until the grid is scrolled.
 */
export async function scrollUntilVisible(page: Page, locator: Locator): Promise<void> {
  await expect
    .poll(
      async () => {
        if (await locator.isVisible().catch(() => false)) return true;
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        return locator.isVisible().catch(() => false);
      },
      { timeout: 15_000 },
    )
    .toBe(true);
}

/** E2e preview uses VITE_CATALOG_GRID_PAGE_SIZE=1; scroll until enough tiles mount. */
export async function ensureGridTileCount(page: Page, minTiles: number): Promise<void> {
  const grid = page.locator('section ul.grid').first();
  await expect
    .poll(
      async () => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        return grid.locator('> li').count();
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(minTiles);
}
