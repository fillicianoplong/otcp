import { expect, test } from '@playwright/test';

import { routeCardDetailCatalogFixture } from './fixtures/cardDetailCatalogRoute.ts';

test.describe('Card detail prices', () => {
  test('opening a sample card shows market prices inside the sets section', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByRole('link', { name: 'Dark Magician' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Dark Magician' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\/card\/46986420/);

    await expect(page.getByRole('heading', { name: 'Dark Magician' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Market prices' })).toBeVisible();
    await expect(page.getByText('Lowest across printings').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open on TCGplayer' })).toBeVisible();
    const setsHeading = page.getByRole('heading', { name: 'Sets (1)' });
    await expect(setsHeading).toBeVisible();
    const marketBox = await page.getByRole('heading', { name: 'Market prices' }).boundingBox();
    const setsBox = await setsHeading.boundingBox();
    expect(marketBox).toBeTruthy();
    expect(setsBox).toBeTruthy();
    expect(marketBox!.y).toBeLessThan(setsBox!.y);
    await expect(page.getByText('TCGplayer', { exact: true })).toBeVisible();
    await expect(page.getByText('$1.23')).toBeVisible();
    await expect(page.getByText('CoolStuffInc', { exact: true })).toBeVisible();
    await expect(page.getByText('$1.10')).toBeVisible();
    await expect(page.getByText('Cardmarket', { exact: true })).toBeVisible();
    await expect(page.getByText('€0.95')).toBeVisible();
    await expect(page.getByText(/as of Oct 28, 2026/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prices', exact: true })).toHaveCount(0);
  });

  test('card artwork zoom viewer opens and closes', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('Dark Magician')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: 'Dark Magician' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\/card\/46986420/);

    const trigger = page.getByRole('button', { name: 'View larger artwork for Dark Magician' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Zoomed artwork for Dark Magician' });
    await expect(dialog).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('uses a stacked layout on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/otcp/search/card/46986420');
    await expect(page.getByRole('heading', { name: 'Dark Magician', level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    const art = page.getByRole('button', { name: 'View larger artwork for Dark Magician' });
    const heading = page.getByRole('heading', { name: 'Dark Magician', level: 1 });
    const artBox = await art.boundingBox();
    const headingBox = await heading.boundingBox();
    expect(artBox).toBeTruthy();
    expect(headingBox).toBeTruthy();
    expect(artBox!.y + artBox!.height).toBeLessThanOrEqual(headingBox!.y + 2);
    await expect(page.getByText('Attribute', { exact: true })).toBeVisible();
  });

  test('uses a two-column layout on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/otcp/search/card/46986420');
    await expect(page.getByRole('heading', { name: 'Dark Magician', level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    const art = page.getByRole('button', { name: 'View larger artwork for Dark Magician' });
    const heading = page.getByRole('heading', { name: 'Dark Magician', level: 1 });
    const artBox = await art.boundingBox();
    const headingBox = await heading.boundingBox();
    expect(artBox).toBeTruthy();
    expect(headingBox).toBeTruthy();
    expect(artBox!.x + artBox!.width).toBeLessThanOrEqual(headingBox!.x + 2);
  });

  test('links each printing row to Search with the set filter applied', async ({ page }) => {
    await routeCardDetailCatalogFixture(page);
    await page.goto('/otcp/search/card/89631139');
    await expect(page.getByRole('heading', { name: 'Sets (24)' })).toBeVisible({
      timeout: 15_000,
    });

    const printingLink = page
      .getByRole('link', { name: 'Search for cards in Phantom Nightmare' })
      .first();
    await expect(printingLink).toBeVisible();
    const href = await printingLink.getAttribute('href');
    expect(href).toMatch(/\/search\?/);
    expect(href).toContain('f=');
    expect(href).toMatch(/Phantom(\+|%20| )Nightmare/);
  });

  test('collapses long set lists with a show-all control', async ({ page }) => {
    await routeCardDetailCatalogFixture(page);
    await page.goto('/otcp/search/card/89631139');
    await expect(page.getByRole('heading', { name: 'Sets (24)' })).toBeVisible({
      timeout: 15_000,
    });

    const setsSection = page.locator('section', {
      has: page.getByRole('heading', { name: 'Sets (24)' }),
    });
    await expect(setsSection.getByRole('listitem')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Show all 24 sets' })).toBeVisible();

    await page.getByRole('button', { name: 'Show all 24 sets' }).click();
    await expect(setsSection.getByRole('listitem')).toHaveCount(24);
    await expect(page.getByRole('button', { name: 'Show fewer' })).toBeVisible();
  });

  test('shows split pendulum description blocks', async ({ page }) => {
    await routeCardDetailCatalogFixture(page);
    await page.goto('/otcp/search/card/16178681');
    await expect(
      page.getByRole('heading', { name: 'Odd-Eyes Pendulum Dragon', level: 1 }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: 'Pendulum Effect' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Description' })).toBeVisible();
    await expect(page.getByText(/reduce the battle damage/i)).toBeVisible();
    await expect(page.getByText(/battle damage this card inflicts/i)).toBeVisible();
  });

  test('shows No listing for a store without a snapshot price', async ({ page }) => {
    await page.goto('/otcp/search/card/89631139');
    await expect(
      page.getByRole('heading', { name: 'Blue-Eyes White Dragon', level: 1 }),
    ).toBeVisible({
      timeout: 15_000,
    });
    const csiLink = page.getByRole('link', { name: 'Open on CoolStuffInc' });
    await expect(csiLink).toBeVisible();
    await expect(csiLink).toContainText('No listing');
  });

  test('store links open vendor search pages in a new tab', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('Dark Magician')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: 'Dark Magician' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\/card\/46986420/);

    const stores = [
      {
        name: 'Open on TCGplayer',
        host: 'www.tcgplayer.com',
        cardNameInHref: encodeURIComponent('Dark Magician'),
      },
      {
        name: 'Open on CoolStuffInc',
        host: 'www.coolstuffinc.com',
        cardNameInHref: 'main_search.php?pa=searchOnName&page=1&resultsPerPage=25&q=Dark+Magician',
      },
      {
        name: 'Open on Cardmarket',
        host: 'www.cardmarket.com',
        cardNameInHref: encodeURIComponent('Dark Magician'),
      },
    ] as const;

    for (const { name, host, cardNameInHref } of stores) {
      const link = page.getByRole('link', { name: new RegExp(`^${name}`) });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      const href = await link.getAttribute('href');
      expect(href, `${name} href`).toBeTruthy();
      expect(new URL(href!).host, `${name} host`).toBe(host);
      expect(href, `${name} encodes card name`).toContain(cardNameInHref);
    }
  });
});
