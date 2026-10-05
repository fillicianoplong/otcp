import { expect, test } from '@playwright/test';

test.describe('Banlists history', () => {
  test('timeline renders and opens a list page', async ({ page }) => {
    await page.goto('/otcp/banlists');
    await expect(page.getByRole('heading', { level: 1, name: 'Banlists' })).toBeVisible();

    const firstEntry = page.locator('main ol li a').first();
    await expect(firstEntry).toBeVisible();
    const label = await firstEntry.locator('.text-lg').textContent();
    expect(label?.trim()).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await firstEntry.click();
    await expect(page).toHaveURL(/\/otcp\/banlists\/\d{4}-\d{2}-\d{2}$/);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Changes from the previous list' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Full list' })).toBeVisible();
  });
});
