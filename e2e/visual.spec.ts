import { expect, test, type Page } from '@playwright/test';

const WIDTHS = [390, 768, 1280, 1920] as const;
const HEIGHT = 900;

const VISUAL_DRAFT = {
  version: 2,
  drafts: [
    {
      id: 'visual-draft',
      name: 'Visual draft',
      formatId: 'advanced',
      main: [46986420, 89631139],
      extra: [],
      side: [],
      updatedAt: '2026-10-28T12:00:00.000Z',
    },
  ],
};

const screenshotOptions = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
  fullPage: false,
  maxDiffPixelRatio: 0.06,
};

async function prepare(page: Page, width: number) {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    const style = document.createElement('style');
    style.textContent = `
      html, body, button, input, textarea, select {
        font-family: "Liberation Sans", Arial, sans-serif !important;
      }
      html, body { scrollbar-width: none; }
      *::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
    `;
    document.documentElement.appendChild(style);
  });
  await page.route('**/*.{png,jpg,jpeg,webp,gif}', async (route) => {
    const url = route.request().url();
    if (url.includes('/favicon') || url.includes('/apple-touch') || url.includes('/dev-art/')) {
      await route.continue();
      return;
    }
    await route.fulfill({
      path: 'e2e/fixtures/dev-art/ygo/small/46986420.webp',
      contentType: 'image/webp',
    });
  });
  await page.setViewportSize({ width, height: HEIGHT });
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.load('16px "Liberation Sans"');
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map(
        (image) =>
          image.complete ||
          new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          }),
      ),
    );
  });
}

test.describe('visual layout', () => {
  test('search at 390 with an active filter hides chips', async ({ page }) => {
    await prepare(page, 390);
    await page.goto('/otcp/search');
    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByRole('checkbox', { name: 'Include DARK', exact: true }).click();
    await page.getByRole('button', { name: /See \d+ results?/ }).click();
    await expect(page.getByRole('button', { name: /Filters · \d+/ })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Active filters' })).toBeHidden();
    await settle(page);
    await expect(page).toHaveScreenshot('search-390-filtered.png', screenshotOptions);
  });

  for (const width of WIDTHS) {
    test(`search at ${width}`, async ({ page }) => {
      await prepare(page, width);
      await page.goto('/otcp/search');
      await expect(page.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();
      await expect(page.getByRole('link', { name: /Dark Magician/ }).first()).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`search-${width}.png`, screenshotOptions);
    });

    test(`card detail at ${width}`, async ({ page }) => {
      await prepare(page, width);
      await page.goto('/otcp/search/card/46986420');
      await expect(page.getByRole('heading', { level: 1, name: 'Dark Magician' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Market prices' })).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`card-detail-${width}.png`, screenshotOptions);
    });

    test(`sets at ${width}`, async ({ page }) => {
      await prepare(page, width);
      await page.goto('/otcp/search/card/46986420');
      const sets = page.locator('section').filter({
        has: page.getByRole('heading', { name: /Sets/ }),
      });
      await expect(sets).toBeVisible();
      await settle(page);
      await expect(sets).toHaveScreenshot(`sets-${width}.png`, screenshotOptions);
    });

    test(`formats at ${width}`, async ({ page }) => {
      await prepare(page, width);
      await page.goto('/otcp/formats');
      await expect(page.getByRole('heading', { level: 1, name: 'Formats' })).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`formats-${width}.png`, screenshotOptions);
    });

    test(`deck editor at ${width}`, async ({ page }) => {
      await page.addInitScript((payload) => {
        localStorage.setItem('otcp:guest-deck-drafts:v1', JSON.stringify(payload));
      }, VISUAL_DRAFT);
      await prepare(page, width);
      await page.goto('/otcp/decks/edit/visual-draft');
      await expect(page.getByLabel('Deck name')).toHaveValue('Visual draft');
      await expect(page.getByRole('heading', { name: 'Main' })).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`deck-editor-${width}.png`, screenshotOptions);
    });

    test(`style guide at ${width}`, async ({ page }) => {
      await prepare(page, width);
      await page.goto('/otcp/styleguide');
      await expect(page.getByRole('heading', { level: 1, name: 'Style guide' })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      await settle(page);
      await expect(page).toHaveScreenshot(`styleguide-${width}.png`, screenshotOptions);
    });
  }
});
