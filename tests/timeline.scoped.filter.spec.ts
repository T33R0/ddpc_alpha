// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';
test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => {
  if (!STORAGE_STATE) test.skip(true, 'STORAGE_STATE not set; skipping auth-scoped tests');
});
test.use({ storageState: STORAGE_STATE || undefined });
async function goto(page, path) { await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }); }

test.describe.configure({ tag: ['@auth', '@timeline', '@scoped'] });

test('VehicleFilter defaults to current id and changing navigates timeline', async ({ page }) => {
  // Go to vehicles list and open first vehicle as A
  await goto(page, '/vehicles');
  const firstLink = page.locator('[data-test="vehicle-card-link"]').first();
  if (!(await firstLink.count())) test.skip(true, 'No vehicles to test');
  await firstLink.click();
  // We are at /vehicles/<A>
  await page.waitForURL(/\/vehicles\/[^/]+$/);
  const match = page.url().match(/\/vehicles\/([^/]+)$/);
  if (!match) test.skip(true, 'Could not determine vehicle ID A from URL');
  const vehicleA = match[1];
  // Navigate to timeline for A
  await goto(page, `/vehicles/${vehicleA}/timeline`);
  // Filter should default to A
  const filter = page.getByTestId('filter-vehicle');
  await expect(filter).toHaveValue(vehicleA);
  // Try change to B using second option if exists
  const options = await filter.locator('option').all();
  if (options.length < 2) test.skip(true, 'Only one vehicle available');
  const valueB = await options[1].getAttribute('value');
  const nameB = await options[1].textContent();
  await filter.selectOption(valueB!);
  await expect(page).toHaveURL(new RegExp(`/vehicles/${valueB}/timeline$`));
  // Announcer should fire
  const announcer = page.getByTestId('filter-announcer');
  await expect(announcer).toContainText(`Vehicle changed to`);
  if (nameB) await expect(announcer).toContainText(nameB.trim());
});
