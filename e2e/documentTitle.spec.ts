import { expect, test } from '@playwright/test';

test.describe('document titles', () => {
  test('client navigations set a distinct title per route', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page).toHaveTitle('Search - OTCP');
    await expect(page.locator('link[rel="icon"][href="/otcp/favicon.svg"]')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await nav.getByRole('link', { name: 'Formats', exact: true }).click();
    await expect(page).toHaveURL(/\/otcp\/formats$/);
    await expect(page).toHaveTitle('Formats - OTCP');
    await expect(page.getByRole('heading', { level: 1, name: 'Formats' })).toBeVisible();

    await page.getByRole('link', { name: 'GOAT', exact: true }).click();
    await expect(page).toHaveURL(/\/otcp\/formats\/goat$/);
    await expect(page).toHaveTitle('GOAT - OTCP');
    await expect(page.getByRole('heading', { level: 1, name: 'GOAT' })).toBeVisible();

    await nav.getByRole('link', { name: 'Decks', exact: true }).click();
    await expect(page).toHaveTitle('Decks - OTCP');
    await expect(page.getByRole('heading', { level: 1, name: 'My decks' })).toBeVisible();

    await page.getByRole('button', { name: 'New deck' }).click();
    await page.getByRole('link', { name: 'Open', exact: true }).first().click();
    await expect(page).toHaveURL(/\/otcp\/decks\/edit\//);
    await expect(page).toHaveTitle('Untitled deck - OTCP');

    const deckName = page.getByRole('textbox', { name: 'Deck name' });
    await deckName.fill('Weekend locals');
    await deckName.blur();
    await expect(page).toHaveTitle('Weekend locals - OTCP');

    await nav.getByRole('link', { name: 'Search', exact: true }).click();
    await expect(page).toHaveTitle('Search - OTCP');
    await expect(page.getByRole('link', { name: 'Dark Magician', exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('link', { name: 'Dark Magician', exact: true }).click();
    await expect(page).toHaveURL(/\/otcp\/search\/card\/46986420/);
    await expect(page.getByRole('heading', { level: 1, name: 'Dark Magician' })).toBeVisible();
    await expect(page).toHaveTitle('Dark Magician - OTCP');

    await page.getByRole('button', { name: '← Back to Search' }).click();
    await page.getByRole('searchbox', { name: 'Find a card' }).fill('Blue-Eyes White Dragon');
    const blueEyes = page
      .getByRole('link', { name: 'Blue-Eyes White Dragon', exact: true })
      .first();
    await expect(blueEyes).toBeVisible({ timeout: 15_000 });
    await blueEyes.click();
    await expect(page).toHaveURL(/\/search\/card\//);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Blue-Eyes White Dragon' }),
    ).toBeVisible();
    await expect(page).toHaveTitle('Blue-Eyes White Dragon - OTCP');

    await page.goto('/otcp/collection');
    await expect(page.getByRole('heading', { level: 1, name: 'Collection' })).toBeVisible();
    await expect(page).toHaveTitle('Collection - OTCP');

    await page.goto('/otcp/lists');
    await expect(page.getByRole('heading', { level: 1, name: 'Lists' })).toBeVisible();
    await expect(page).toHaveTitle('Lists - OTCP');

    await page.goto('/otcp/about');
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
    await expect(page).toHaveTitle('About - OTCP');

    await page.goto('/otcp/account');
    await expect(page.getByRole('heading', { level: 1, name: 'Account' })).toBeVisible();
    await expect(page).toHaveTitle('Account - OTCP');

    await page.goto('/otcp/does-not-exist');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page).toHaveTitle('OTCP');
  });
});
