import { expect, test } from '@playwright/test';

test.describe('Card detail prices', () => {
  test('opening a sample card shows all three storefront prices', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('Dark Magician')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('link', { name: 'Dark Magician' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\/card\/46986420/);

    await expect(page.getByRole('heading', { name: 'Dark Magician' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prices' })).toBeVisible();
    await expect(page.getByText('TCGplayer')).toBeVisible();
    await expect(page.getByText('$1.23')).toBeVisible();
    await expect(page.getByText('CoolStuffInc')).toBeVisible();
    await expect(page.getByText('$1.10')).toBeVisible();
    await expect(page.getByText('Cardmarket')).toBeVisible();
    await expect(page.getByText('€0.95')).toBeVisible();
    await expect(page.getByText(/as of Oct 28, 2026/)).toBeVisible();
  });
});
