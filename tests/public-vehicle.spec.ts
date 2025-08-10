// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe.configure({ tag: '@public' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PUBLIC_VEHICLE_ID = process.env.PUBLIC_VEHICLE_ID || '';

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

const publicTest = PUBLIC_VEHICLE_ID ? test : test.skip;

publicTest('Public vehicle page renders header + panels and OG meta @public', async ({ page }) => {
  await goto(page, `/v/${PUBLIC_VEHICLE_ID}`);

  await expect(page.locator('h1.text-2xl')).toBeVisible();
  // Three panels headings
  await expect(page.getByText('Quick stats')).toBeVisible();
  await expect(page.getByText(/tasks \(private\)/i)).toBeVisible();
  await expect(page.getByText('Recent events')).toBeVisible();

  // OG tags exist
  const ogTitle = page.locator('meta[property="og:title"]');
  await expect(ogTitle).toHaveCount(1);
});


