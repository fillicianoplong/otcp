import { expect, test, type Page } from '@playwright/test';

async function hideColumn(page: Page, label: string) {
  await page.getByRole('button', { name: 'Columns' }).click();
  await page.getByRole('menuitemcheckbox', { name: label, exact: true }).click();
}

test.describe('Table column pickers', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Search table hides a column from the shared picker', async ({ page }) => {
    await page.goto('/otcp/search?view=table');
    await expect(page.getByRole('columnheader', { name: 'ATK' })).toBeVisible();
    await hideColumn(page, 'ATK');
    await expect(page.getByRole('columnheader', { name: 'ATK' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  });

  test('format detail table hides a column', async ({ page }) => {
    await page.goto('/otcp/formats/goat');
    await page.getByRole('button', { name: 'Table view' }).click();
    const poolBox = await page.getByRole('button', { name: 'Search card pool' }).boundingBox();
    const columnsBox = await page.getByRole('button', { name: 'Columns' }).boundingBox();
    const toggleBox = await page.getByRole('button', { name: 'Table view' }).boundingBox();
    expect(poolBox).not.toBeNull();
    expect(columnsBox).not.toBeNull();
    expect(toggleBox).not.toBeNull();
    expect(Math.abs(poolBox!.height - columnsBox!.height)).toBeLessThan(1);
    expect(Math.abs(poolBox!.height - toggleBox!.height)).toBeLessThan(1);
    expect(Math.abs(poolBox!.width - toggleBox!.width)).toBeLessThan(1);
    expect(Math.abs(poolBox!.y - columnsBox!.y)).toBeLessThan(1);
    expect(poolBox!.x).toBeLessThan(columnsBox!.x);
    expect(columnsBox!.x).toBeLessThan(toggleBox!.x);
    await expect(page.getByRole('columnheader', { name: 'Card type' }).first()).toBeVisible();
    await hideColumn(page, 'Card type');
    await expect(page.getByRole('columnheader', { name: 'Card type' })).toHaveCount(0);
  });

  test('Formats table hides List date and keeps Format', async ({ page }) => {
    await page.goto('/otcp/formats');
    await expect(page.getByRole('columnheader', { name: 'List date' })).toBeVisible();
    await page.getByRole('button', { name: 'Columns' }).click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Format' })).toHaveCount(0);
    await page.getByRole('menuitemcheckbox', { name: 'List date' }).click();
    await expect(page.getByRole('columnheader', { name: 'List date' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Format' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('columnheader', { name: 'List date' })).toHaveCount(0);
  });

  test('Sets table hides Code', async ({ page }) => {
    await page.goto('/otcp/search/card/46986420');
    await expect(page.getByRole('heading', { name: /Sets/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Code' })).toBeVisible();
    await hideColumn(page, 'Code');
    await expect(page.getByRole('columnheader', { name: 'Code' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Set' })).toBeVisible();
  });

  test('Lists and Collection tables have a column picker', async ({ page }) => {
    await page.goto('/otcp/lists');
    await expect(page.getByRole('columnheader', { name: 'Qty' })).toBeVisible();
    await hideColumn(page, 'Qty');
    await expect(page.getByRole('columnheader', { name: 'Qty' })).toHaveCount(0);
    await expect(page.getByText('No lists yet.')).toBeVisible();

    await page.goto('/otcp/collection');
    await expect(page.getByRole('columnheader', { name: 'Condition' })).toBeVisible();
    await hideColumn(page, 'Condition');
    await expect(page.getByRole('columnheader', { name: 'Condition' })).toHaveCount(0);
    await expect(page.getByText('Nothing in your collection yet.')).toBeVisible();
  });

  test('About notices table hides Version', async ({ page }) => {
    await page.goto('/otcp/about');
    await expect(page.getByRole('columnheader', { name: 'Version' })).toBeVisible();
    await hideColumn(page, 'Version');
    await expect(page.getByRole('columnheader', { name: 'Version' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Package' })).toBeVisible();
  });

  test('style guide shows the table toolbar', async ({ page }) => {
    await page.goto('/otcp/styleguide');
    await expect(page.getByRole('heading', { name: 'Table' })).toBeVisible();
    await hideColumn(page, 'ATK');
    await expect(page.getByRole('columnheader', { name: 'ATK' })).toHaveCount(0);
    await expect(page.getByRole('cell', { name: 'Dark Magician' })).toBeVisible();
  });
});
