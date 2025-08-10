import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/owner.json' });

test('sort order changes for Name/Year/Last Updated', async ({ page }) => {
  await page.goto('/vehicles');
  const select = page.getByTestId('vehicles-sort');
  await expect(select).toBeVisible();
  await select.selectOption('name');
  await select.selectOption('year');
  await select.selectOption('updated');
  // Basic smoke that it does not crash and keeps rendering cards
  await expect(page.getByTestId('vehicle-card').first()).toBeVisible();
});


