import { expect, test } from '@playwright/test';

test.describe('Format banlist pages', () => {
  test('GOAT banlist renders and Card pool opens Search with format only', async ({ page }) => {
    await page.goto('/otcp/formats/goat');
    await expect(page.getByRole('heading', { level: 1, name: 'GOAT' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Format details' })).toContainText(
      '2005-04-01',
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Forbidden' })).toBeVisible();

    await page.getByRole('link', { name: 'Card pool' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\?format=goat$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();
  });

  test('Formats list is ordered and links to banlists', async ({ page }) => {
    await page.goto('/otcp/formats');
    await expect(page.getByRole('heading', { level: 1, name: 'Formats' })).toBeVisible();

    const links = page.locator('main ul li a');
    const expectedOrder = [
      'Advanced',
      'Traditional',
      'Speed Duel',
      'Genesys',
      'HAT',
      'Tengu Plant',
      'Edison',
      'GOAT',
    ];
    for (let index = 0; index < expectedOrder.length; index += 1) {
      await expect(links.nth(index)).toHaveText(expectedOrder[index]!);
    }

    await links.filter({ hasText: 'GOAT' }).click();
    await expect(page).toHaveURL(/\/otcp\/formats\/goat$/);
  });

  test('GOAT banlist grid wraps at 390px without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/otcp/formats/goat');
    await expect(page.getByRole('heading', { level: 2, name: 'Forbidden' })).toBeVisible();

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth;
    });
    expect(overflow).toBe(false);
  });
});
