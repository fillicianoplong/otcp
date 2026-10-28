import { expect, test } from '@playwright/test';

test('smoke page loads in Chromium', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('OTCP');
  await expect(page.getByRole('heading', { level: 1, name: 'OTCP' })).toBeVisible();
});
