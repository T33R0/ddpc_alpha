import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/owner.json' });

test('privacy badge renders and shows Public/Private', async ({ page }) => {
  await page.goto('/vehicles');
  const badge = page.getByTestId('vehicle-privacy-badge').first();
  await expect(badge).toBeVisible();
  const text = await badge.innerText();
  expect(["Public", "Private"]).toContain(text);
});


