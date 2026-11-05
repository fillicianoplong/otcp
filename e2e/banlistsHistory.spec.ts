import { expect, test } from '@playwright/test';

test.describe('Banlists history', () => {
  test('legacy banlists index redirects to formats; dated list pages still work', async ({
    page,
  }) => {
    await page.goto('/otcp/banlists');
    await expect(page).toHaveURL(/\/otcp\/formats$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Formats' })).toBeVisible();

    await page.goto('/otcp/banlists/2026-02-02');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Changes from the previous list' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Full list' })).toBeVisible();
  });
});
