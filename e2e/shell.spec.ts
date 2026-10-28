import { expect, test } from '@playwright/test';

test('home explains the project', async ({ page }) => {
  await page.goto('/otcp/');
  await expect(page.getByRole('heading', { level: 1, name: 'Open TCG Project' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page).toHaveTitle('OTCP — Open TCG Project');
});

test('about page is reachable from the shell', async ({ page }) => {
  await page.goto('/otcp/');
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'About' })
    .click();
  await expect(page).toHaveURL(/\/otcp\/about$/);
  await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
  await expect(page).toHaveTitle('About — OTCP');
});

test('about can be opened from the keyboard', async ({ page }) => {
  await page.goto('/otcp/');
  await page.getByRole('link', { name: 'About' }).first().focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/otcp\/about$/);
});

test('shell does not overflow a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/otcp/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflows).toBe(false);
});
