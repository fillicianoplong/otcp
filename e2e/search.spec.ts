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
});
