import { expect, test } from '@playwright/test';

test.describe('List view on Search page', () => {
  test('switching to list shows named rows and filters still apply', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/otcp/search');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'List view' }).click();
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText('Blue-Eyes White Dragon', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByRole('checkbox', { name: 'Include DARK', exact: true }).click();
    await page.getByRole('button', { name: /See \d+ results?/ }).click();

    await expect(page.getByText('5 cards')).toBeVisible();
    await expect(page.getByText('Blue-Eyes White Dragon', { exact: true })).not.toBeVisible();
  });

  test('stored list preference shows as table on desktop without list toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/otcp/search?view=list');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'List view' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Table view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    const row = table.locator('tbody tr').filter({ hasText: 'Blue-Eyes White Dragon' });
    await expect(row).toContainText('LIGHT');
    await expect(row).toContainText('Dragon');
    await expect(row).not.toContainText('·');
  });

  test('phone list rows show compact YGO icons instead of long type lines', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/otcp/search');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Table view' })).toBeHidden();
    await page.getByRole('button', { name: 'List view' }).click();

    const list = page.getByRole('region', { name: 'Search' });
    const row = list.locator('a[href="/otcp/search/card/89631139"]');
    await expect(row.locator('img[src*="attr-light"]').first()).toBeVisible();
    await expect(row.locator('img[src*="race-dragon"]').first()).toBeVisible();
    await expect(row.locator('img[src*="icons/row/level"]').first()).toBeVisible();
    await expect(row.locator('img[src*="icons/row/atk"]').first()).toBeVisible();
    await expect(row.getByText('8', { exact: true })).toBeVisible();
    await expect(row.getByText('3000', { exact: true })).toBeVisible();
    await expect(row.getByText('2500', { exact: true })).toBeVisible();
    await expect(row.getByText('LIGHT · Normal · Dragon')).not.toBeVisible();
  });
});
