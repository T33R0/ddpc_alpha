// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

const auth = STORAGE_STATE
  ? test.extend({
      storageState: async ({}, use) => {
        await use(STORAGE_STATE);
      },
    })
  : test.skip;

auth.describe.configure({ tag: '@auth' });

auth('profile page renders for signed-in users', async ({ page }) => {
  await goto(page, '/profile');
  await expect(page.getByTestId('profile-page')).toBeVisible();
});
<<<<<<< Current (Your changes)
=======

auth('profile page shows edit form and billing link', async ({ page }) => {
  await goto(page, '/profile');
  await expect(page.getByTestId('profile-edit-form')).toBeVisible();
  await page.getByRole('link', { name: 'Billing' }).click();
  await expect(page.getByTestId('billing-page')).toBeVisible();
});
>>>>>>> Incoming (Background Agent changes)
