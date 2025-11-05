import { expect, type Page } from '@playwright/test';

export const SEARCH_PAGE = '/otcp/search';

export function searchPath(query = ''): string {
  if (query.length === 0) return '/otcp/search';
  const params = new URLSearchParams({ q: query });
  return `/otcp/search?${params.toString()}`;
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
