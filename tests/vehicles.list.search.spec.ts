import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/owner.json' });

test('typing in search filters vehicles', async ({ page }) => {
  await page.goto('/vehicles');
  const search = page.getByTestId('vehicles-search');
  await expect(search).toBeVisible();
  await search.fill('zzz-unlikely');
  await expect(page.getByTestId('vehicles-empty')).toBeVisible();
});


