import { expect, test, type Page } from '@playwright/test';

async function hideColumn(page: Page, label: string) {
  const header = page.getByRole('columnheader', { name: label, exact: true }).first();
  await header.hover();
  await header.getByRole('button', { name: `${label} column menu` }).click();
  await page.getByRole('menuitem', { name: 'Hide column' }).click();
}

test.describe('Table column pickers', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Search table hides a column from the header menu', async ({ page }) => {
    await page.goto('/otcp/search?view=table');
    await expect(page.getByRole('button', { name: 'Columns' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'ATK' })).toBeVisible();
    await hideColumn(page, 'ATK');
    await expect(page.getByRole('columnheader', { name: 'ATK' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  });

  test('format detail table hides a column', async ({ page }) => {
    await page.goto('/otcp/formats/goat');
    await page.getByRole('button', { name: 'Table view' }).click();
    const sortBox = await page.getByRole('button', { name: 'Name ↑' }).boundingBox();
    const poolBox = await page.getByRole('button', { name: 'Search card pool' }).boundingBox();
    const toggleBox = await page.getByRole('button', { name: 'Table view' }).boundingBox();
    expect(sortBox).not.toBeNull();
    expect(poolBox).not.toBeNull();
    expect(toggleBox).not.toBeNull();
    expect(Math.abs(sortBox!.height - 32)).toBeLessThan(1);
    expect(Math.abs(poolBox!.height - sortBox!.height)).toBeLessThan(1);
    expect(Math.abs(toggleBox!.height - sortBox!.height)).toBeLessThan(1);
    expect(Math.abs(poolBox!.width - toggleBox!.width)).toBeLessThan(1);
    expect(Math.abs(sortBox!.y - toggleBox!.y)).toBeLessThan(1);
    expect(sortBox!.x).toBeLessThan(poolBox!.x);
    expect(poolBox!.x).toBeLessThan(toggleBox!.x);
    await expect(page.getByRole('button', { name: 'Columns' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Card type' }).first()).toBeVisible();
    await hideColumn(page, 'Card type');
    await expect(page.getByRole('columnheader', { name: 'Card type' })).toHaveCount(0);
  });

  test('Formats table hides List date and keeps Format', async ({ page }) => {
    await page.goto('/otcp/formats');
    await expect(page.getByRole('button', { name: 'Columns' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'List date' })).toBeVisible();
    const format = page.getByRole('columnheader', { name: 'Format', exact: true });
    await format.hover();
    await format.getByRole('button', { name: 'Format column menu' }).click();
    await expect(page.getByRole('menuitem', { name: 'Hide column' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await hideColumn(page, 'List date');
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

  test('header menu sorts, moves, and hides with the shared setup', async ({ page }) => {
    await page.goto('/otcp/search?view=table');
    const atk = page.getByRole('columnheader', { name: 'ATK', exact: true });
    await atk.hover();
    await atk.getByRole('button', { name: 'ATK column menu' }).click();
    await page.getByRole('menuitemradio', { name: 'Sort descending' }).click();
    await expect(page).toHaveURL(/sort=atk/);
    await expect(page).toHaveURL(/dir=desc/);
    await expect(page.getByRole('button', { name: 'ATK, sorted descending' })).toBeVisible();

    await page.getByRole('button', { name: 'Grid view' }).click();
    await expect(page.getByRole('button', { name: 'ATK ↓' })).toBeVisible();
    await expect(
      page
        .getByRole('complementary', { name: 'Filter sidebar' })
        .getByRole('button', { name: 'Sort' }),
    ).toHaveCount(0);

    await page.getByRole('button', { name: 'Table view' }).click();
    const cardType = page.getByRole('columnheader', { name: 'Card type', exact: true });
    await cardType.hover();
    await cardType.getByRole('button', { name: 'Card type column menu' }).click();
    await page.getByRole('menuitem', { name: 'Move right' }).click();
    const labels = await page
      .getByRole('columnheader')
      .evaluateAll((headers) => headers.map((header) => header.getAttribute('aria-label')));
    expect(labels.indexOf('Attribute')).toBeLessThan(labels.indexOf('Card type'));

    await cardType.hover();
    await cardType.getByRole('button', { name: 'Card type column menu' }).click();
    await page.getByRole('menuitem', { name: 'Hide column' }).click();
    await expect(page.getByRole('columnheader', { name: 'Card type' })).toHaveCount(0);

    const name = page.getByRole('columnheader', { name: 'Name', exact: true });
    await name.hover();
    await name.getByRole('button', { name: 'Name column menu' }).click();
    await page.getByRole('menuitem', { name: 'Add column' }).click();
    await page.getByRole('menuitem', { name: 'Card type' }).click();
    await expect(page.getByRole('columnheader', { name: 'Card type' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('columnheader', { name: 'ATK' })).toBeVisible();
    await expect(page).toHaveURL(/sort=atk/);
    const labelsAfter = await page
      .getByRole('columnheader')
      .evaluateAll((headers) => headers.map((header) => header.getAttribute('aria-label')));
    expect(labelsAfter.indexOf('Attribute')).toBeLessThan(labelsAfter.indexOf('Card type'));
  });

  test('header menu is keyboard accessible', async ({ page }) => {
    await page.goto('/otcp/formats');
    const pool = page.getByRole('columnheader', { name: 'Pool through', exact: true });
    const trigger = pool.getByRole('button', { name: 'Pool through column menu' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu', { name: 'Pool through column menu' })).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Move right' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Pool through column menu' })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('phone keeps the column menu button visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/otcp/formats');
    const format = page.getByRole('columnheader', { name: 'Format', exact: true });
    await expect(format.getByRole('button', { name: 'Format column menu' })).toBeVisible();
    await format.getByRole('button', { name: 'Format column menu' }).click();
    const menu = page.getByRole('menu', { name: 'Format column menu' });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });

  test('style guide shows the table toolbar', async ({ page }) => {
    await page.goto('/otcp/styleguide');
    await expect(page.getByRole('heading', { name: 'Table' })).toBeVisible();
    await hideColumn(page, 'ATK');
    await expect(page.getByRole('columnheader', { name: 'ATK' })).toHaveCount(0);
    await expect(page.getByRole('cell', { name: 'Dark Magician' })).toBeVisible();
  });
});
