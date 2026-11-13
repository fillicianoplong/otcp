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
      'Ban list',
      'Effective',
      'Cards released by',
      'Latest set',
      'Not included',
    ]) {
      await expect(details.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(details.getByText('Deck size')).toHaveCount(0);
    await expect(details.getByText(/Goat snapshots/)).toHaveCount(0);
    await expect(details.getByText('Sources')).toHaveCount(0);
    await expect(page.getByRole('contentinfo')).toContainText('Sources:');
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'GoatFormat.com' }),
    ).toBeAttached();
    const labels = await details.locator('[data-info-card] dt').allTextContents();
    expect(labels).toEqual([
      'Ban list',
      'Effective',
      'Cards released by',
      'Latest set',
      'Not included',
    ]);
    const desktopCards = await details.locator('[data-info-card]').evaluateAll((cards) =>
      cards.map((card) => {
        const box = card.getBoundingClientRect();
        return { top: box.top, height: box.height, left: box.left };
      }),
    );
    expect(Math.abs(desktopCards[0]!.top - desktopCards[1]!.top)).toBeLessThan(2);
    expect(Math.abs(desktopCards[0]!.height - desktopCards[1]!.height)).toBeLessThan(1);
    await expect(details.getByRole('link', { name: /Ban list/ })).toHaveAttribute(
      'href',
      '/otcp/search?format=goat',
    );

    const forbidden = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Forbidden', exact: true }),
    });
    await expect(forbidden.getByRole('list')).toBeVisible();
    await forbidden.locator('summary').click();
    await expect(forbidden.getByRole('list')).toBeHidden();
    await forbidden.locator('summary').click();
    await expect(forbidden.getByRole('list')).toBeVisible();

    await expect(page.getByRole('link', { name: /All formats/ })).toHaveCount(0);
    const pool = page.getByRole('button', { name: 'Search card pool' });
    await expect(pool).toBeVisible();
    const poolBox = await pool.boundingBox();
    const toggleBox = await page.getByRole('button', { name: 'Grid view' }).boundingBox();
    expect(poolBox).not.toBeNull();
    expect(toggleBox).not.toBeNull();
    expect(Math.abs(poolBox!.y - toggleBox!.y)).toBeLessThan(1);
    expect(Math.abs(poolBox!.height - toggleBox!.height)).toBeLessThan(1);
    expect(Math.abs(poolBox!.width - toggleBox!.width)).toBeLessThan(1);
    await pool.click();
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
    const phoneCards = await page
      .getByRole('complementary', { name: 'Format details' })
      .locator('[data-info-card]')
      .evaluateAll((cards) =>
        cards.map((card) => {
          const box = card.getBoundingClientRect();
          const label = card.querySelector('dt')?.textContent ?? '';
          return { label, top: box.top, left: box.left, width: box.width };
        }),
      );
    const byLabel = new Map(phoneCards.map((card) => [card.label, card]));
    const banList = byLabel.get('Ban list');
    const effective = byLabel.get('Effective');
    const released = byLabel.get('Cards released by');
    const latest = byLabel.get('Latest set');
    const excluded = byLabel.get('Not included');
    expect(banList && effective && released && latest && excluded).toBeTruthy();
    expect(banList!.width).toBeGreaterThan(effective!.width + released!.width * 0.5);
    expect(Math.abs(effective!.top - released!.top)).toBeLessThan(2);
    expect(effective!.top).toBeGreaterThan(banList!.top + 8);
    expect(Math.abs(latest!.top - excluded!.top)).toBeLessThan(2);
    expect(latest!.top).toBeGreaterThan(effective!.top + 8);

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test('format detail grid is 4 across on a phone and 10 on desktop', async ({ page }) => {
    async function columnCount(width: number) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/otcp/formats/goat');
      const grid = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: 'Forbidden', exact: true }) })
        .getByRole('list');
      await expect(grid).toBeVisible();
      return grid.evaluate(
        (element) =>
          getComputedStyle(element)
            .gridTemplateColumns.split(' ')
            .filter((part) => part.length > 0).length,
      );
    }

    expect(await columnCount(390)).toBe(4);
    expect(await columnCount(1280)).toBe(10);
  });
});
