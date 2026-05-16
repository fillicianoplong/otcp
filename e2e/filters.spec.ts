import { expect, test } from '@playwright/test';

import { FILTER_QUERY_KEY } from '../src/catalog/filterUrlState.ts';
import { serializeFilterState } from '../src/catalog/filterEngine.ts';

test.describe('Facet filters on Search page', () => {
  test('toggling an attribute facet changes the result count', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });

    const darkCheckbox = page
      .getByRole('complementary', { name: 'Filter sidebar' })
      .getByRole('checkbox', { name: 'Include DARK', exact: true });
    await darkCheckbox.click();

    await expect(page.getByText('5 cards')).toBeVisible();
    await expect(
      page.getByRole('list', { name: 'Active filters' }).getByRole('button', { name: /DARK/ }),
    ).toBeVisible();
  });

  test('cycles include, exclude, and off on tri-state checkboxes', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });

    const sidebar = page.getByRole('complementary', { name: 'Filter sidebar' });
    const darkOption = () =>
      sidebar.getByRole('checkbox', { name: /^(Include|Exclude) DARK$/, exact: true });

    await darkOption().click();
    await expect(darkOption()).toHaveAttribute('aria-checked', 'true');

    await darkOption().click();
    await expect(darkOption()).toHaveAttribute('aria-checked', 'mixed');
    await expect(page.getByRole('button', { name: /Not DARK/ })).toBeVisible();

    await darkOption().click();
    await expect(
      sidebar.getByRole('checkbox', { name: 'Include DARK', exact: true }),
    ).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByRole('button', { name: /Not DARK/ })).not.toBeVisible();
  });

  test('persists facet state in the URL query', async ({ page }) => {
    const state = {
      version: 1 as const,
      facets: { attribute: { include: ['WIND'] } },
    };
    const params = new URLSearchParams();
    params.set(FILTER_QUERY_KEY, serializeFilterState(state));
    await page.goto(`/otcp/search?${params.toString()}`);

    await expect(page.getByText('1 card')).toBeVisible({ timeout: 15_000 });
    await expect(
      page
        .getByRole('complementary', { name: 'Filter sidebar' })
        .getByRole('checkbox', { name: 'Include WIND', exact: true }),
    ).toHaveAttribute('aria-checked', 'true');
  });

  test('lists set facet options newest first in the filter panel', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });

    const sidebar = page.getByRole('complementary', { name: 'Filter sidebar' });
    const setHeading = sidebar.getByRole('button', { name: 'Set', exact: true });
    if ((await setHeading.getAttribute('aria-expanded')) === 'false') {
      await setHeading.click();
    }

    await expect(sidebar.getByRole('button', { name: 'Newest first' })).not.toBeVisible();
    const setSection = setHeading.locator('xpath=ancestor::section[1]');
    await expect(setSection.getByRole('checkbox').first()).toHaveAttribute(
      'aria-label',
      'Include Phantom Nightmare',
    );
  });

  test('short facet groups avoid inner scroll and expand with Show more', async ({ page }) => {
    await page.goto('/otcp/search');
    await expect(page.getByText('22 cards')).toBeVisible({ timeout: 15_000 });

    const sidebar = page.getByRole('complementary', { name: 'Filter sidebar' });
    const frameHeading = sidebar.getByRole('button', { name: 'Monster card type', exact: true });
    if ((await frameHeading.getAttribute('aria-expanded')) === 'false') {
      await frameHeading.click();
    }

    const optionList = sidebar.locator('[data-facet-options="monsterFrame"]');
    await expect(optionList).toHaveCount(1);
    const overflowBefore = await optionList.evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflowBefore).not.toBe('auto');
    expect(overflowBefore).not.toBe('scroll');

    const frameSection = frameHeading.locator('xpath=ancestor::section[1]');
    await expect(frameSection.getByRole('checkbox')).toHaveCount(8);
    await frameSection.getByRole('button', { name: 'Show more' }).click();
    await expect(frameSection.getByRole('checkbox')).toHaveCount(9);

    const overflowAfterExpand = await optionList.evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflowAfterExpand).not.toBe('auto');
    expect(overflowAfterExpand).not.toBe('scroll');
  });
});
