import { expect, test } from '@playwright/test';

import { FILTER_QUERY_KEY } from '../src/catalog/filterUrlState.ts';
import { serializeFilterState } from '../src/catalog/filterEngine.ts';

test.describe('Facet filters on Search page', () => {
  test('toggling an attribute facet changes the result count', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('4 cards')).toBeVisible({ timeout: 15_000 });

    const darkRow = page.getByRole('complementary', { name: 'Filter sidebar' }).getByText('DARK', {
      exact: true,
    });
    await darkRow.click();

    await expect(page.getByText('1 card')).toBeVisible();
    await expect(page.getByRole('button', { name: /Attribute: DARK/i })).toBeVisible();
  });

  test('persists facet state in the URL query', async ({ page }) => {
    const state = {
      version: 1 as const,
      facets: { attribute: { include: ['LIGHT'] } },
    };
    const params = new URLSearchParams();
    params.set(FILTER_QUERY_KEY, serializeFilterState(state));
    await page.goto(`/otcp/search?${params.toString()}`);

    await expect(page.getByText('1 card')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('checkbox', { name: /LIGHT/i }).first()).toBeChecked();
  });
});
