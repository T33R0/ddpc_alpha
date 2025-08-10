// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe.configure({ tag: '@auth' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';
const VEHICLE_A = process.env.VEHICLE_A || process.env.VEHICLE_ID_WRITE || '';
const VEHICLE_B = process.env.VEHICLE_B || '';

const auth = STORAGE_STATE && VEHICLE_A && VEHICLE_B ? test.extend({
  storageState: async ({}, use) => { await use(STORAGE_STATE); },
}) : test.skip;

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

auth('Header has no vehicle switcher; palette still navigates via inline picker', async ({ page }) => {
  await goto(page, `/vehicles/${VEHICLE_A}`);
  await expect(page.getByTestId('vehicle-switcher')).toHaveCount(0);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  await page.getByTestId('cmdk-input').fill('timeline');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('vehicle-picker-inline')).toBeVisible();
});


