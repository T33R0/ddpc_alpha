// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe.configure({ tag: '@public' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PUBLIC_VEHICLE_ID = process.env.PUBLIC_VEHICLE_ID || '';

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

const publicTest = PUBLIC_VEHICLE_ID ? test : test.skip;

publicTest('Vehicle details renders header and snapshots @public', async ({ page }) => {
  await goto(page, `/vehicles/${PUBLIC_VEHICLE_ID}`);

  // Header present
  await expect(page.locator('h1.text-2xl')).toBeVisible();
  await expect(page.getByTestId('vehicle-helper-copy')).toBeVisible();

  // Image or placeholder is present
  const img = page.locator('img');
  const placeholder = page.getByText('No photo');
  await expect(img.or(placeholder)).toBeVisible();

  // Three panels present by headings
  await expect(page.getByText('Quick stats')).toBeVisible();
  await expect(page.getByText('Open tasks')).toBeVisible();
  await expect(page.getByText('Recent events')).toBeVisible();

  // Footer links
  await expect(page.getByRole('link', { name: /view all tasks/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /view timeline/i })).toBeVisible();
});


