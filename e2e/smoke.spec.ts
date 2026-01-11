import { expect, test } from '@playwright/test';

const PRIMARY_LINKS = ['Search', 'Formats', 'Decks', 'Collection', 'Lists', 'Account'] as const;

test.describe('smoke', () => {
  test('home redirects to Search with shell landmarks', async ({ page }) => {
    const response = await page.goto('/otcp/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/otcp\/search$/);
    await expect(page).toHaveTitle('OTCP');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeAttached();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();
  });

  test('desktop primary nav at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/otcp/search');

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toBeVisible();
    for (const name of PRIMARY_LINKS) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  });

  test('phone hamburger nav at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/otcp/search');

    const menuButton = page.getByRole('button', { name: 'Open menu' });
    await expect(menuButton).toBeVisible();

    const drawerId = await menuButton.getAttribute('aria-controls');
    expect(drawerId).toBeTruthy();

    await menuButton.click();
    const closeButton = page.getByRole('button', { name: 'Close menu' });
    await expect(closeButton).toHaveAttribute('aria-expanded', 'true');

    const drawer = page.locator(`#${drawerId}`);
    for (const name of PRIMARY_LINKS) {
      await expect(drawer.getByRole('link', { name, exact: true })).toBeVisible();
    }
  });
});
