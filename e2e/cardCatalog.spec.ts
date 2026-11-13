import { expect, test } from '@playwright/test';

import { scrollUntilVisible } from './helpers/searchAllArt.ts';

test.describe('CardCatalog on Search', () => {
  test('home shows cards from the sample dataset', async ({ page }) => {
    await page.goto('/otcp/');
    await expect(page).toHaveURL(/\/otcp\/search$/);

    const darkMagician = page.getByRole('link', { name: 'Dark Magician', exact: true });
    const blueEyes = page.getByRole('link', { name: 'Blue-Eyes White Dragon' });
    const monsterReborn = page.getByRole('link', { name: 'Monster Reborn' });
    await scrollUntilVisible(page, monsterReborn);
    await expect(darkMagician).toBeVisible();
    await expect(blueEyes).toBeVisible();
    await expect(monsterReborn).toBeVisible();
  });

  test('shows an error state with retry when the dataset fails', async ({ page }) => {
    await page.route('**/data/datasets/**', (route) => {
      void route.fulfill({ status: 500, body: 'fail' });
    });

    await page.goto('/otcp/search');

    await expect(page.getByRole('heading', { name: 'Could not load cards' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });
});
