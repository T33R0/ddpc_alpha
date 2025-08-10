import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/owner.json' });

test('empty state renders with CTA when no vehicles match filter', async ({ page }) => {
  await page.goto('/vehicles');
  const search = page.getByTestId('vehicles-search');
  await search.fill('zzz-no-match-12345');
  const empty = page.getByTestId('vehicles-empty');
  await expect(empty).toBeVisible();
  await expect(empty.getByText('Add vehicle')).toBeVisible();
});


