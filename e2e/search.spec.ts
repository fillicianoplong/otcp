import { expect, test } from '@playwright/test';

import { SEARCH_PAGE, scrollUntilVisible, searchPath } from './helpers/searchAllArt.ts';
import {
  SAMPLE_DARK_MAGICIAN_QUERY_TILE_COUNT_LABEL,
  SAMPLE_SEARCH_TILE_COUNT_LABEL,
  SAMPLE_SINGLE_CARD_TILE_COUNT_LABEL,
} from './helpers/searchExpectedCounts.ts';

test.describe('Search on Search page', () => {
  test('typing a unique name narrows the grid to matching artworks', async ({ page }) => {
    await page.goto(searchPath('magician'));
    await expect(page.getByRole('link', { name: 'Dark Magician', exact: true })).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByText(SAMPLE_DARK_MAGICIAN_QUERY_TILE_COUNT_LABEL)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dark Magician', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Blue-Eyes White Dragon' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Monster Reborn' })).not.toBeVisible();
  });

  test('typing a passcode narrows the grid to that card', async ({ page }) => {
    await page.goto(SEARCH_PAGE);
    await expect(page.getByRole('link', { name: 'Blue-Eyes White Dragon' })).toBeVisible({
      timeout: 15_000,
    });

    const search = page.getByLabel('Find a card');
    await search.fill('89631139');

    await expect(page.getByText(SAMPLE_SINGLE_CARD_TILE_COUNT_LABEL)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('link', { name: 'Blue-Eyes White Dragon' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dark Magician' })).not.toBeVisible();
  });

  test('opening a card from scrolled search starts at the top and restores scroll on back', async ({
    page,
  }) => {
    await page.goto('/otcp/search?view=grid');
    await expect(page.getByText(SAMPLE_SEARCH_TILE_COUNT_LABEL)).toBeVisible({ timeout: 15_000 });
    const searchRegion = page.getByRole('region', { name: 'Search' });

    const monsterReborn = searchRegion.getByRole('link', { name: 'Monster Reborn', exact: true });
    await scrollUntilVisible(page, monsterReborn);

    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(0);

    await monsterReborn.click();
    await expect(page).toHaveURL(/\/otcp\/search\/card\//);

    const backControl = page.getByRole('button', { name: '← Back to Search' });
    await expect(backControl).toBeInViewport();
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(0);

    await backControl.click();
    await expect(page).toHaveURL(/\/otcp\/search(\?view=grid)?\/?$/);
    await expect(page.getByRole('link', { name: 'Monster Reborn', exact: true })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeGreaterThanOrEqual(Math.max(0, scrollBefore - 4));
  });

  test('returning from a card restores scroll position and loaded batches', async ({ page }) => {
    await page.goto('/otcp/search?view=grid');
    await expect(page.getByText(SAMPLE_SEARCH_TILE_COUNT_LABEL)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Grid view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const searchRegion = page.getByRole('region', { name: 'Search' });

    const monsterReborn = searchRegion.getByRole('link', { name: 'Monster Reborn', exact: true });
    await scrollUntilVisible(page, monsterReborn);

    const scrollBefore = await page.evaluate(() => window.scrollY);
    await monsterReborn.click();
    await expect(page).toHaveURL(/\/otcp\/search\/card\//);

    await page.getByRole('button', { name: '← Back to Search' }).click();
    await expect(page).toHaveURL(/\/otcp\/search(\?view=grid)?\/?$/);
    await expect(page.getByRole('link', { name: 'Monster Reborn', exact: true })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeGreaterThanOrEqual(Math.max(0, scrollBefore - 4));
  });
});
