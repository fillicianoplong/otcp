import { expect, test } from '@playwright/test';

import { routeCardDetailCatalogFixture } from './fixtures/cardDetailCatalogRoute.ts';
import { SEARCH_PAGE, scrollUntilVisible } from './helpers/searchAllArt.ts';

test.describe('Card detail prices', () => {
  test('opening a sample card shows market prices inside the sets section', async ({ page }) => {
    await page.goto(SEARCH_PAGE);
    const darkMagician = page.getByRole('link', { name: 'Dark Magician', exact: true });
    await scrollUntilVisible(page, darkMagician);

    await darkMagician.click();
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
    await page.goto(SEARCH_PAGE);
    const darkMagician = page.getByRole('link', { name: 'Dark Magician', exact: true });
    await scrollUntilVisible(page, darkMagician);
    await darkMagician.click();
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
    const attributeValue = page.locator('dd').filter({ hasText: 'DARK' });
    await expect(attributeValue.locator('img[src*="attr-dark"]')).toBeVisible();
  });

  test('detail chips show the monster type icon beside the race value', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/otcp/search/card/46986420');
    await expect(page.getByRole('heading', { name: 'Dark Magician', level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    const typeChip = page.getByRole('link', { name: 'Search for cards with Type Spellcaster' });
    await expect(typeChip.locator('img[src*="race-spellcaster"]')).toBeVisible();
  });

  test('ATK chip opens Search with an exact ATK range filter', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/otcp/search/card/46986420');
    await expect(page.getByRole('heading', { name: 'Dark Magician', level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Search for cards with ATK 2500' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\?.*f=/);
    await expect(
      page.getByRole('list', { name: 'Active filters' }).getByRole('button', { name: /ATK 2500/ }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Table view' }).click();
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    for (let index = 0; index < rowCount; index += 1) {
      await expect(rows.nth(index)).toContainText('2500');
    }

    await page.goBack();
    await expect(page).toHaveURL(/\/otcp\/search\/card\/46986420/);
    await expect(page.getByRole('heading', { name: 'Dark Magician', level: 1 })).toBeVisible();
  });

  test('archetype chip opens Search with the archetype filter applied', async ({ page }) => {
    await page.goto('/otcp/search/card/46986420');
    await expect(page.getByRole('heading', { name: 'Dark Magician', level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Search for cards with Archetype Dark Magician' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\?.*f=/);
    await expect(page.getByText('5 cards')).toBeVisible({ timeout: 15_000 });
    await expect(
      page
        .getByRole('list', { name: 'Active filters' })
        .getByRole('button', { name: /Dark Magician/ }),
    ).toBeVisible();
  });

  test('keeps a gutter and a readable info column at mid width', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.goto('/otcp/search/card/46986420');
    const art = page.getByRole('button', { name: 'View larger artwork for Dark Magician' });
    const heading = page.getByRole('heading', { name: 'Dark Magician', level: 1 });
    const priceLink = page.getByRole('link', { name: 'Open on TCGplayer' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
    await expect(priceLink).toBeVisible();

    const artBox = await art.boundingBox();
    const headingBox = await heading.boundingBox();
    const priceBox = await priceLink.boundingBox();
    expect(artBox).toBeTruthy();
    expect(headingBox).toBeTruthy();
    expect(priceBox).toBeTruthy();
    expect(artBox!.width).toBeGreaterThan(280);
    expect(artBox!.y + artBox!.height).toBeLessThanOrEqual(1000);
    expect(headingBox!.x - (artBox!.x + artBox!.width)).toBeGreaterThanOrEqual(40);
    expect(priceBox!.width).toBeGreaterThan(240);
    expect(priceBox!.x).toBeGreaterThanOrEqual(0);
    expect(priceBox!.x + priceBox!.width).toBeLessThanOrEqual(901);
    expect(headingBox!.x + headingBox!.width).toBeLessThanOrEqual(901);
  });

  test('places alternate artworks in the info column and keeps a single-art card empty of that section', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/otcp/search/card/46986420');
    const art = page.getByRole('button', { name: 'View larger artwork for Dark Magician' });
    const artworks = page.getByRole('heading', { name: 'Artworks', exact: true });
    await expect(artworks).toBeVisible({ timeout: 15_000 });

    const artBox = await art.boundingBox();
    const artworksBox = await artworks.boundingBox();
    expect(artBox).toBeTruthy();
    expect(artworksBox).toBeTruthy();
    expect(artBox!.width).toBeGreaterThan(420);
    expect(artBox!.y + artBox!.height).toBeLessThanOrEqual(900);
    expect(artworksBox!.x).toBeGreaterThanOrEqual(artBox!.x + artBox!.width + 40);
    const description = page.getByRole('heading', { name: 'Description', exact: true });
    const descriptionBox = await description.boundingBox();
    const prices = page.getByRole('heading', { name: 'Market prices', exact: true });
    const pricesBox = await prices.boundingBox();
    expect(descriptionBox).toBeTruthy();
    expect(pricesBox).toBeTruthy();
    expect(descriptionBox!.y).toBeLessThan(artworksBox!.y);
    expect(artworksBox!.y).toBeLessThan(pricesBox!.y);

    const alt = page.getByRole('button', {
      name: 'Show artwork 46986421 for Dark Magician',
      exact: true,
    });
    await alt.click();
    await expect(page).toHaveURL(/\/search\/card\/46986421(?:\?|$)/);
    await expect(alt).toHaveAttribute('aria-pressed', 'true');
    await expect(art.locator('img')).toHaveAttribute('src', /46986421/, { timeout: 15_000 });

    await page.goto('/otcp/search/card/89631139');
    await expect(
      page.getByRole('heading', { name: 'Blue-Eyes White Dragon', level: 1 }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Artworks', exact: true })).toHaveCount(0);
  });

  test('stacks art, info, and alternate artworks on a phone without sideways overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/otcp/search/card/46986420');
    const art = page.getByRole('button', { name: 'View larger artwork for Dark Magician' });
    const heading = page.getByRole('heading', { name: 'Dark Magician', level: 1 });
    const artworks = page.getByRole('heading', { name: 'Artworks', exact: true });
    await expect(artworks).toBeVisible({ timeout: 15_000 });

    const artBox = await art.boundingBox();
    const headingBox = await heading.boundingBox();
    const artworksBox = await artworks.boundingBox();
    expect(artBox).toBeTruthy();
    expect(headingBox).toBeTruthy();
    expect(artworksBox).toBeTruthy();
    const description = page.getByRole('heading', { name: 'Description', exact: true });
    const priceLink = page.getByRole('link', { name: 'Open on TCGplayer' });
    const descriptionBox = await description.boundingBox();
    const priceBox = await priceLink.boundingBox();
    expect(descriptionBox).toBeTruthy();
    expect(priceBox).toBeTruthy();
    expect(artBox!.y + artBox!.height).toBeLessThanOrEqual(headingBox!.y + 2);
    expect(descriptionBox!.y).toBeGreaterThan(headingBox!.y);
    expect(descriptionBox!.y).toBeLessThan(artworksBox!.y);
    expect(artworksBox!.y).toBeGreaterThan(artBox!.y + artBox!.height);
    expect(Math.abs(artBox!.x - headingBox!.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(artBox!.width - priceBox!.width)).toBeLessThanOrEqual(4);
    expect(artBox!.x).toBeGreaterThanOrEqual(0);
    expect(artBox!.x + artBox!.width).toBeLessThanOrEqual(391);
    expect(artworksBox!.x + artworksBox!.width).toBeLessThanOrEqual(391);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
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

  test('shows the whole card on a 1920×1080 viewport with a gutter', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/otcp/search/card/46986420');
    const art = page.getByRole('button', { name: 'View larger artwork for Dark Magician' });
    const heading = page.getByRole('heading', { name: 'Dark Magician', level: 1 });
    const priceLink = page.getByRole('link', { name: 'Open on TCGplayer' });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    const artBox = await art.boundingBox();
    const headingBox = await heading.boundingBox();
    const priceBox = await priceLink.boundingBox();
    expect(artBox).toBeTruthy();
    expect(headingBox).toBeTruthy();
    expect(priceBox).toBeTruthy();
    expect(artBox!.x).toBeGreaterThanOrEqual(0);
    expect(artBox!.y).toBeGreaterThanOrEqual(0);
    expect(artBox!.x + artBox!.width).toBeLessThanOrEqual(1920);
    expect(artBox!.y + artBox!.height).toBeLessThanOrEqual(1080);
    expect(artBox!.width).toBeGreaterThan(520);
    expect(headingBox!.x - (artBox!.x + artBox!.width)).toBeGreaterThanOrEqual(40);
    expect(priceBox!.width).toBeGreaterThan(320);
    expect(priceBox!.x + priceBox!.width).toBeLessThanOrEqual(1920);
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
    await expect(setsSection.locator('tbody tr')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Show all 24 sets' })).toBeVisible();

    await page.getByRole('button', { name: 'Show all 24 sets' }).click();
    await expect(setsSection.locator('tbody tr')).toHaveCount(24);
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
    await page.goto(SEARCH_PAGE);
    const darkMagician = page.getByRole('link', { name: 'Dark Magician', exact: true });
    await scrollUntilVisible(page, darkMagician);
    await darkMagician.click();
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
