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

auth('Switcher updates vehicle-scoped route and combined route', async ({ page }) => {
  await goto(page, `/vehicles/${VEHICLE_A}`);
  await page.getByTestId('vehicle-switcher').click();
  await page.getByTestId('vehicle-switcher-input').fill(VEHICLE_B.slice(0, 4));
  await page.getByTestId('vehicle-switcher-item').first().click();
  await expect(page).toHaveURL(new RegExp(`/vehicles/${VEHICLE_B}`));

  await goto(page, `/timeline?vehicleId=${VEHICLE_A}`);
  await page.getByTestId('vehicle-switcher').click();
  await page.getByTestId('vehicle-switcher-input').fill(VEHICLE_B.slice(0, 4));
  await page.getByTestId('vehicle-switcher-item').first().click();
  await expect(page).toHaveURL(new RegExp(`/timeline\?`));
});


