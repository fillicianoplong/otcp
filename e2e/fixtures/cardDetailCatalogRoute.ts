import type { Page } from '@playwright/test';

import cardDetailCatalog from './card-detail-catalog.json' with { type: 'json' };
import cardDetailPointer from './card-detail-pointer.json' with { type: 'json' };

/** Serves a catalog with many Blue-Eyes printings and a pendulum card for card-detail e2e. */
export async function routeCardDetailCatalogFixture(page: Page): Promise<void> {
  await page.route('**/data/current.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(cardDetailPointer),
    });
  });
  await page.route('**/data/datasets/card-detail-e2e.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(cardDetailCatalog),
    });
  });
}
