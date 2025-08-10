// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe.configure({ tag: '@public' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

test('Signed-out header: brand, nav, Sign in; no dev auth controls', async ({ page }) => {
  await goto(page, '/');
  await expect(page.getByTestId('brand-ddpc')).toBeVisible();
  await expect(page.getByTestId('nav-garage')).toBeVisible();
  await expect(page.getByTestId('nav-about')).toBeVisible();
  await expect(page.getByTestId('btn-signin')).toBeVisible();
  await expect(page.getByText(/Magic link|Google/i)).toHaveCount(0);
});

const auth = STORAGE_STATE ? test.extend({
  storageState: async ({}, use) => { await use(STORAGE_STATE); },
}) : test.skip;

auth('Signed-in header: avatar menu present, no Sign in', async ({ page }) => {
  await goto(page, '/');
  await expect(page.getByTestId('menu-avatar')).toBeVisible();
  await expect(page.getByTestId('btn-signin')).toHaveCount(0);
  await page.getByTestId('brand-ddpc').click();
  await expect(page).toHaveURL(new RegExp(`/`));
});


