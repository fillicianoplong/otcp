import { expect, test } from '@playwright/test';

test.describe('Format banlist pages', () => {
  test('GOAT banlist renders and Card pool opens Search with format only', async ({ page }) => {
    await page.goto('/otcp/formats/goat');
    await expect(page.getByRole('heading', { level: 1, name: 'GOAT' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Format details' })).toContainText(
      '2005-04-01',
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Forbidden' })).toBeVisible();

    const details = page.getByRole('complementary', { name: 'Format details' });
    for (const label of [
      'Effective',
      'Ban list',
      'Cards released by',
      'Latest set',
      'Not included',
      'Sources',
    ]) {
      await expect(details.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(details.getByText('Deck size')).toHaveCount(0);
    const widths = await details.evaluate((aside) => {
      const inner = aside.firstElementChild;
      if (!(inner instanceof HTMLElement)) return null;
      const probe = document.createElement('span');
      probe.textContent = '0';
      probe.style.font = getComputedStyle(inner).font;
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      inner.appendChild(probe);
      const ch = probe.getBoundingClientRect().width;
      probe.remove();
      return {
        asideWidth: aside.getBoundingClientRect().width,
        innerWidth: inner.getBoundingClientRect().width,
        maxWidth: Number.parseFloat(getComputedStyle(inner).maxWidth),
        ch,
      };
    });
    expect(widths).not.toBeNull();
    expect(Math.abs(widths!.maxWidth - 70 * widths!.ch)).toBeLessThan(1.5);
    expect(widths!.innerWidth).toBeLessThanOrEqual(widths!.maxWidth + 1);
    expect(widths!.asideWidth).toBeGreaterThan(widths!.innerWidth + 8);

    await page.getByRole('link', { name: 'Card pool' }).click();
    await expect(page).toHaveURL(/\/otcp\/search\?format=goat$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();
  });

  test('Formats table is ordered and links to format detail', async ({ page }) => {
    await page.goto('/otcp/formats');
    await expect(page.getByRole('heading', { level: 1, name: 'Formats' })).toBeVisible();

    const links = page.locator('main tbody tr td:first-child a');
    const expectedPrefix = ['Advanced', 'Traditional', 'Speed Duel', 'Genesys'];
    for (let index = 0; index < expectedPrefix.length; index += 1) {
      await expect(links.nth(index)).toHaveText(expectedPrefix[index]!);
    }

    await links.filter({ hasText: 'GOAT' }).click();
    await expect(page).toHaveURL(/\/otcp\/formats\/goat$/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('otcp:format'))).toBe('goat');
  });

  test('Formats row cells and keyboard open the format without swallowing nested clicks', async ({
    page,
  }) => {
    await page.goto('/otcp/formats');
    const goatRow = page.locator('main tbody tr').filter({ hasText: 'GOAT' });

    const coversVisibleCells = await goatRow.evaluate((row) => {
      if (!(row instanceof HTMLTableRowElement)) return false;
      row.scrollIntoView({ block: 'center', inline: 'nearest' });
      for (const cell of Array.from(row.cells)) {
        const rect = cell.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        const points = [
          [rect.left + 4, rect.top + rect.height / 2],
          [rect.right - 4, rect.top + rect.height / 2],
          [rect.left + rect.width / 2, rect.top + rect.height / 2],
        ];
        for (const [x, y] of points) {
          const hit = document.elementFromPoint(x, y);
          const href = hit?.closest('a')?.getAttribute('href') ?? '';
          if (!href.includes('/formats/goat')) return false;
        }
      }
      return true;
    });
    expect(coversVisibleCells).toBe(true);

    await goatRow.evaluate((row) => {
      if (!(row instanceof HTMLTableRowElement)) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Note';
      button.dataset.testid = 'formats-row-nested';
      row.cells[1]?.appendChild(button);
    });
    await page.getByTestId('formats-row-nested').click();
    await expect(page).toHaveURL(/\/otcp\/formats\/?$/);
    await page.getByTestId('formats-row-nested').evaluate((button) => button.remove());

    await page.setViewportSize({ width: 390, height: 844 });
    const narrowCovers = await goatRow.evaluate((row) => {
      if (!(row instanceof HTMLTableRowElement)) return 0;
      row.scrollIntoView({ block: 'center', inline: 'nearest' });
      let checked = 0;
      for (const cell of Array.from(row.cells)) {
        const rect = cell.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        checked += 1;
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        const href = hit?.closest('a')?.getAttribute('href') ?? '';
        if (!href.includes('/formats/goat')) return 0;
      }
      return checked;
    });
    expect(narrowCovers).toBe(3);

    await page.setViewportSize({ width: 1280, height: 720 });
    await goatRow.scrollIntoViewIfNeeded();
    const poolCell = await goatRow.locator('td').nth(2).boundingBox();
    expect(poolCell).not.toBeNull();
    await page.mouse.click(poolCell!.x + poolCell!.width / 2, poolCell!.y + poolCell!.height / 2);
    await expect(page).toHaveURL(/\/otcp\/formats\/goat$/);
    await page.goto('/otcp/formats');
    const goat = page.getByRole('link', { name: 'GOAT', exact: true });
    await goat.scrollIntoViewIfNeeded();
    await goat.evaluate((element) => {
      if (!(element instanceof HTMLElement)) return;
      element.focus({ focusVisible: true } as FocusOptions);
    });
    await expect(goat).toBeFocused();
    const outlineWidth = await goat.evaluate((element) => {
      const row = element.closest('tr');
      return row ? getComputedStyle(row).outlineWidth : '';
    });
    expect(outlineWidth).toBe('2px');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/otcp\/formats\/goat$/);
  });

  test('GOAT banlist grid wraps at 390px without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/otcp/formats/goat');
    await expect(page.getByRole('heading', { level: 2, name: 'Forbidden' })).toBeVisible();

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth;
    });
    expect(overflow).toBe(false);
  });
});
