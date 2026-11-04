import { expect, test } from '@playwright/test';

import { ensureGridTileCount, searchPathWithAllArtOff } from './helpers/searchAllArt.ts';

test.describe('variant artworks', () => {
  test('All artworks switch and art query on detail', async ({ page }) => {
    await page.goto(searchPathWithAllArtOff('Dark Magician'));
    await page.getByRole('switch', { name: /^All artworks/ }).click();
    await expect(page.getByText('5 artworks')).toBeVisible({ timeout: 15_000 });

    await ensureGridTileCount(page, 5);

    await expect(page.getByRole('link', { name: 'Dark Magician', exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Dark Magician, artwork 2 of 5', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /^Dark Magician/ })).toHaveCount(5);

    await page.getByRole('switch', { name: /^All artworks/ }).click();
    await expect(page.getByRole('link', { name: 'Dark Magician', exact: true })).toHaveCount(1);
    await expect(page.getByText('1 card')).toBeVisible();

    await page.getByRole('switch', { name: /^All artworks/ }).click();
    await expect(page.getByText('5 artworks')).toBeVisible();
    await ensureGridTileCount(page, 5);
    await page.getByRole('link', { name: 'Dark Magician, artwork 2 of 5', exact: true }).click();
    await expect(page).toHaveURL(/art=46986421/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Dark Magician', level: 1 })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Show artwork 46986421 for Dark Magician', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
