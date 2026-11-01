import { expect, test } from '@playwright/test';

test.describe('Card detail prices', () => {
  test('opening a sample card shows all three storefront prices', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByRole('link', { name: 'Dark Magician' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'Dark Magician' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\/card\/46986420/);

    await expect(page.getByRole('heading', { name: 'Dark Magician' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prices' })).toBeVisible();
    await expect(page.getByText('TCGplayer', { exact: true })).toBeVisible();
    await expect(page.getByText('$1.23')).toBeVisible();
    await expect(page.getByText('CoolStuffInc', { exact: true })).toBeVisible();
    await expect(page.getByText('$1.10')).toBeVisible();
    await expect(page.getByText('Cardmarket', { exact: true })).toBeVisible();
    await expect(page.getByText('€0.95')).toBeVisible();
    await expect(page.getByText(/as of Oct 28, 2026/)).toBeVisible();
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
