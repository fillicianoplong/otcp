import { expect, type Locator, type Page } from '@playwright/test';

export const SEARCH_PAGE = '/otcp/search';

export function searchPath(query = ''): string {
  if (query.length === 0) return '/otcp/search';
  const params = new URLSearchParams({ q: query });
  return `/otcp/search?${params.toString()}`;
}

/**
 * The filter column scrolls with the page, so the document bottom can sit far
 * below the result list. Bring the list's load-more marker into view instead.
 */
async function scrollResultsToLoadMore(page: Page): Promise<void> {
  const sentinel = page.locator('div.h-8[aria-hidden="true"]').last();
  if ((await sentinel.count()) > 0) {
    await sentinel.scrollIntoViewIfNeeded().catch(() => undefined);
    return;
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
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
        if ((await locator.count()) > 0) {
          await locator.scrollIntoViewIfNeeded();
          return locator.isVisible().catch(() => false);
        }
        await scrollResultsToLoadMore(page);
        return false;
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
        const count = await grid.locator('> li').count();
        if (count >= minTiles) return count;
        await scrollResultsToLoadMore(page);
        return grid.locator('> li').count();
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(minTiles);
}
