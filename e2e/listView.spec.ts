import { expect, test } from '@playwright/test';

test.describe('List view on Search page', () => {
  test('switching to list shows named rows and filters still apply', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'List view' }).click();
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText('Blue-Eyes White Dragon', { exact: true }).first()).toBeVisible();

    const darkCheckbox = page
      .getByRole('complementary', { name: 'Filter sidebar' })
      .getByRole('checkbox', { name: 'Include DARK', exact: true });
    await darkCheckbox.click();

    await expect(page.getByText('5 cards')).toBeVisible();
    await expect(page.getByText('Blue-Eyes White Dragon', { exact: true })).not.toBeVisible();
  });
});
