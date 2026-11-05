import { expect, type Locator, type Page, test } from '@playwright/test';

async function dragOnto(page: Page, source: Locator, target: Locator) {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('missing drag box');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2 + 12, { steps: 4 });
  await page.mouse.move(to.x + Math.min(40, to.width / 2), to.y + Math.min(48, to.height / 2), {
    steps: 16,
  });
  await page.mouse.up();
}

test.describe('Deck drag and drop', () => {
  test('adds from the mini search, moves between sections, and removes on the search panel', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('otcp:view:card-finder', 'grid');
      localStorage.setItem('otcp:view:deck-zones', 'grid');
      localStorage.setItem(
        'otcp:guest-deck-drafts:v1',
        JSON.stringify({
          version: 2,
          drafts: [
            {
              id: 'drag-deck',
              name: 'Drag deck',
              formatId: 'advanced',
              main: [],
              extra: [],
              side: [],
              updatedAt: '2026-11-12T00:00:00.000Z',
            },
          ],
        }),
      );
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/otcp/decks/edit/drag-deck');
    await expect(page.getByRole('heading', { name: 'Main' })).toBeVisible({ timeout: 15_000 });

    const search = page.getByRole('searchbox', { name: 'Search cards' });
    await search.fill('Blue-Eyes');
    const libraryTile = page.getByTestId('library-card-89631139');
    await expect(libraryTile).toBeVisible();
    await libraryTile.dragTo(page.getByTestId('deck-zone-main'));
    await expect(page.getByTestId('deck-editor-message')).toHaveText(
      /Added Blue-Eyes White Dragon to Main/,
    );
    await expect(page.getByTestId('deck-zone-main-count')).toHaveText(/^1/);

    const mainTile = page.locator(
      '[data-testid="deck-zone-main"] [data-card-name="Blue-Eyes White Dragon"]',
    );
    const sideZone = page.getByTestId('deck-zone-side');
    await sideZone.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await dragOnto(page, mainTile, sideZone);
    await expect(page.getByTestId('deck-editor-message')).toHaveText(
      /Moved Blue-Eyes White Dragon to Side/,
    );
    await expect(page.getByTestId('deck-zone-main-count')).toHaveText(/^0/);
    await expect(page.getByTestId('deck-zone-side-count')).toHaveText(/^1/);

    const sideTile = page.locator(
      '[data-testid="deck-zone-side"] [data-card-name="Blue-Eyes White Dragon"]',
    );
    await dragOnto(page, sideTile, page.locator('[data-drop="library"]'));
    await expect(page.getByTestId('deck-editor-message')).toHaveText(
      /Removed one Blue-Eyes White Dragon from Side/,
    );
    await expect(page.getByTestId('deck-zone-side-count')).toHaveText(/^0/);

    await search.fill('Stardust');
    const stardust = page.getByTestId('library-card-64366838');
    await expect(stardust).toBeVisible();
    await stardust.dragTo(page.getByTestId('deck-zone-main'));
    await expect(page.getByTestId('deck-editor-message')).toHaveText(/Extra Deck monster/);
    await expect(page.getByTestId('deck-zone-main-count')).toHaveText(/^0/);
    await expect(page.getByTestId('deck-zone-extra-count')).toHaveText(/^0/);
  });
});
