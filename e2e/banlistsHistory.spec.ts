import { expect, test } from '@playwright/test';

test.describe('Banlists history', () => {
  test('legacy banlist URLs redirect to the matching format detail page', async ({ page }) => {
    await page.goto('/otcp/banlists');
    await expect(page).toHaveURL(/\/otcp\/formats$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Formats' })).toBeVisible();

    await page.goto('/otcp/banlists/2026-02-02');
    await expect(page).toHaveURL(/\/otcp\/formats\/mjolnir$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Mjolnir' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Forbidden' })).toBeVisible();
  });
});
