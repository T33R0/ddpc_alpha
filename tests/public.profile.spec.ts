import { test, expect } from '@playwright/test';

test.describe.configure({ tag: '@auth' });

test.use({ storageState: '.auth/owner.json' });

test('public profile page loads after setting username', async ({ page }) => {
  await page.goto('/profile');
  await page.getByTestId('profile-edit-form').locator('input[name="username"]').fill('owner');
  await page.getByRole('button', { name: 'Save Profile' }).click();
  await page.goto('/u/owner');
  await expect(page.getByText('@owner')).toBeVisible();
});