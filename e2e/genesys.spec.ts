import { expect, test } from '@playwright/test';

test.describe('Genesys format', () => {
  test('format page shows point list and details rows', async ({ page }) => {
    await page.goto('/otcp/formats/genesys');
    await expect(page.getByRole('heading', { level: 1, name: 'Genesys' })).toBeVisible();
    const details = page.getByRole('complementary', { name: 'Format details' });
    await expect(details).toContainText('Point cap');
    await expect(details).toContainText('100');
    await expect(details.getByText('Effective')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: '100 points' })).toBeVisible();
  });

  test('Formats list includes Genesys by name', async ({ page }) => {
    await page.goto('/otcp/formats');
    await expect(page.getByRole('link', { name: 'Genesys' })).toBeVisible();
  });
});
