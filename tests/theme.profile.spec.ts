import { test, expect } from '@playwright/test';

test.describe.configure({ tag: '@theme' });

test.use({ storageState: '.auth/owner.json' });

test('Profile ThemeSection visible and toggles dark, persists', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByTestId('profile-theme-section')).toBeVisible();

  const html = page.locator('html');

  await page.getByTestId('radio-theme-dark').check();
  await expect(async () => {
    const theme = await html.getAttribute('data-theme');
    expect(theme).toBe('dark');
  }).toPass();

  await page.reload();
  await expect(async () => {
    const theme = await html.getAttribute('data-theme');
    expect(theme).toBe('dark');
  }).toPass();
});


