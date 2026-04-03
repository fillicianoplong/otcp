import { expect, test } from '@playwright/test';

test.describe('Search on Search page', () => {
  test('typing a unique name narrows the grid to one card', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('Dark Magician')).toBeVisible({ timeout: 15_000 });

    const search = page.getByLabel('Find a card');
    await search.fill('magician');

    await expect(page.getByText('1 card')).toBeVisible();
    await expect(page.getByText('Dark Magician')).toBeVisible();
    await expect(page.getByText('Blue-Eyes White Dragon')).not.toBeVisible();
    await expect(page.getByText('Monster Reborn')).not.toBeVisible();
  });

  test('typing a passcode narrows the grid to that card', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('Blue-Eyes White Dragon')).toBeVisible({ timeout: 15_000 });

    const search = page.getByLabel('Find a card');
    await search.fill('89631139');

    await expect(page.getByText('1 card')).toBeVisible();
    await expect(page.getByText('Blue-Eyes White Dragon')).toBeVisible();
    await expect(page.getByText('Dark Magician')).not.toBeVisible();
  });

  test('returning from a card restores scroll position and loaded batches', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('4 cards')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Monster Reborn' })).not.toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('link', { name: 'Monster Reborn' })).toBeVisible({
      timeout: 10_000,
    });

    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.getByRole('link', { name: 'Monster Reborn' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\/card\//);

    await page.getByRole('button', { name: '← Back to Search' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\/?$/);
    await expect(page.getByRole('link', { name: 'Monster Reborn' })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeGreaterThanOrEqual(Math.max(0, scrollBefore - 4));
  });
});
