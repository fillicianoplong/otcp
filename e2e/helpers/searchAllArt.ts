import { expect, type Page } from '@playwright/test';

/** Search URL with one gallery tile per matching card (card-level counts in e2e). */
export const SEARCH_ALL_ART_OFF = '/otcp/search?allArt=0';

export function searchPathWithAllArtOff(query = ''): string {
  const params = new URLSearchParams({ allArt: '0' });
  if (query.length > 0) {
    params.set('q', query);
  }
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
