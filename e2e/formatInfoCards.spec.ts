import { expect, test } from '@playwright/test';

import { listFormats } from '../src/format/formatCatalog.ts';

test.describe('Format info cards stay on one line', () => {
  test.describe.configure({ timeout: 240_000 });

  for (const width of [1280, 390] as const) {
    test(`no value wraps at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const format of listFormats()) {
        await page.goto(`/otcp/formats/${format.id}`);
        await expect(page.getByRole('heading', { level: 1, name: format.name })).toBeVisible();
        const offenders = await page.locator('[data-info-card] dd').evaluateAll((nodes) =>
          nodes.flatMap((node) => {
            const style = getComputedStyle(node);
            const lineHeight = Number.parseFloat(style.lineHeight);
            const height = node.getBoundingClientRect().height;
            const overflows = node.scrollWidth > node.clientWidth + 1;
            const wraps = Number.isFinite(lineHeight) && height > lineHeight + 2;
            if (!overflows && !wraps) return [];
            return [
              `${node.textContent ?? ''} scroll=${node.scrollWidth} client=${node.clientWidth} height=${height}`,
            ];
          }),
        );
        expect(offenders, `${format.id} at ${width}px`).toEqual([]);
      }
    });
  }
});
