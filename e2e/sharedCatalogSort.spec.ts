import { expect, test } from '@playwright/test';

import { ensureGridTileCount } from './helpers/searchAllArt.ts';
import { SAMPLE_SEARCH_TILE_COUNT_LABEL } from './helpers/searchExpectedCounts.ts';

test.describe('Shared catalog sort', () => {
  test('Ban sort in table view stays in that order on the grid', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/otcp/search?format=advanced');
    await expect(page.getByText(SAMPLE_SEARCH_TILE_COUNT_LABEL)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Table view' }).click();
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await table.getByRole('button', { name: 'Sort by Ban' }).click();

    await expect(page).toHaveURL(/sort=ban/);
    await expect(page).toHaveURL(/dir=asc/);
    await expect(table.getByRole('row').nth(1)).toContainText('Monster Reborn');
    await expect
      .poll(async () => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        const row = table.getByRole('row').nth(2);
        if ((await row.count()) === 0) return '';
        return row.innerText();
      })
      .toContain('Raigeki');

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole('button', { name: 'Columns' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Sort' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Grid view' }).click();
    await expect(page.getByRole('button', { name: 'Grid view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('combobox', { name: 'Sort' })).toHaveValue('ban');
    await expect(page.getByRole('button', { name: 'Columns' })).toHaveCount(0);
    await expect(page).toHaveURL(/sort=ban/);
    await expect(page).toHaveURL(/format=advanced/);

    const grid = page.getByRole('region', { name: 'Search' }).locator('ul.grid');
    await ensureGridTileCount(page, 2);
    await expect
      .poll(async () => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        const labels = await grid
          .locator('> li a')
          .evaluateAll((links) => links.map((link) => link.getAttribute('aria-label') ?? ''));
        const names: string[] = [];
        for (const label of labels) {
          const name = label.split(',')[0]?.trim() ?? '';
          if (name.length > 0 && names[names.length - 1] !== name) names.push(name);
        }
        return names.slice(0, 2).join('|');
      })
      .toBe('Monster Reborn|Raigeki');
  });
});
