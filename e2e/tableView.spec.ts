import { expect, test } from '@playwright/test';

test.describe('Table view on Search page', () => {
  test('table shows rows, ATK sort reorders, toggle hidden at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/otcp/search');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Table view' }).click();
    await expect(page.getByRole('button', { name: 'Table view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.locator('thead')).toContainText('Card type');
    await expect(table.locator('thead')).toContainText('Type');

    const blueEyesRow = table.locator('tbody tr').filter({ hasText: 'Blue-Eyes White Dragon' });
    await expect(blueEyesRow).toContainText('Normal Monster');
    await expect(blueEyesRow).toContainText('LIGHT');
    await expect(blueEyesRow).toContainText('Dragon');
    await expect(blueEyesRow).not.toContainText('·');

    await expect(table.getByRole('row').nth(1)).toBeVisible();

    const firstRowBefore = table.getByRole('row').nth(1).getByText(/.+/).first();
    await expect(firstRowBefore).toBeVisible();
    const nameBefore = await firstRowBefore.innerText();

    await table.getByRole('button', { name: 'Sort by ATK' }).click();
    await table.getByRole('button', { name: 'ATK, sorted ascending' }).click();

    await expect(table.getByRole('row').nth(1)).toContainText('Rainbow Dragon');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: 'Table view' })).toBeHidden();

    if (nameBefore !== 'Rainbow Dragon') {
      await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    }
  });
});
