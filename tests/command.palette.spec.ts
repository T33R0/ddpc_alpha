// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe.configure({ tag: '@public' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PUBLIC_VEHICLE_ID = process.env.PUBLIC_VEHICLE_ID || '';

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

const pub = PUBLIC_VEHICLE_ID ? test : test.skip;

pub('Palette opens and executes basic commands', async ({ page }) => {
  await goto(page, '/');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  await expect(page.getByTestId('cmdk-input')).toBeVisible();
  await page.getByTestId('cmdk-input').fill('timeline');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/timeline/);
});


