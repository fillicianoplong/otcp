import { expect, test } from '@playwright/test';

const PRIMARY_LINKS = [
  'Search',
  'Formats',
  'Decks',
  'Collection',
  'Lists',
  'About',
  'Account',
] as const;

test.describe('smoke', () => {
  test('home redirects to Search with shell landmarks', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    const response = await page.goto('/otcp/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/otcp\/search$/);
    await expect(page).toHaveTitle('OTCP');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeAttached();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toBeVisible();
    for (const name of PRIMARY_LINKS) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
    }

    expect(consoleErrors).toEqual([]);
  });

  test('desktop primary nav at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/otcp/search');

    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  });

  test('about page shows About and notices sections', async ({ page }) => {
    await page.goto('/otcp/about');
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Notices' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Card data and images' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
  });

  test('legacy /notices URL redirects to About', async ({ page }) => {
    await page.goto('/otcp/notices');
    await expect(page).toHaveURL(/\/otcp\/about$/);
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
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
