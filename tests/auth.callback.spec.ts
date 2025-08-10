// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

// These tests expect NEXT_PUBLIC_E2E_AUTH_BYPASS=1 at runtime for success-path.
// Without it, the success case will likely show the friendly error instead of redirecting.

test.describe.configure({ tag: '@auth' });

test('auth callback success redirects when e2e bypass is enabled', async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS !== '1', 'Requires NEXT_PUBLIC_E2E_AUTH_BYPASS=1');
  // Should redirect to / by default
  const resp = await page.goto(`${BASE_URL}/auth/callback?code=TEST`, { waitUntil: 'domcontentloaded' });
  // Either a direct redirect was followed, or we ended on /
  await expect(page).toHaveURL(new RegExp(`${BASE_URL}/($|\?)`));
  expect(resp?.status()).toBeLessThan(400);
});

test('auth callback error path shows friendly message', async ({ page }) => {
  // Missing code should render error page
  const resp = await page.goto(`${BASE_URL}/auth/callback`, { waitUntil: 'domcontentloaded' });
  expect(resp?.status()).toBe(400);
  await expect(page.getByText(/Sign-in error/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /Try again/i })).toBeVisible();
});
