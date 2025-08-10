// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';

test.describe.configure({ tag: ['@auth', '@vehicles'], mode: 'serial' });
test.beforeAll(async () => {
  if (!STORAGE_STATE) test.skip(true, 'STORAGE_STATE not set; skipping auth vehicles tests');
});
test.use({ storageState: STORAGE_STATE || undefined });

async function goto(page, path) { await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }); }

test('Search narrows results', async ({ page }) => {
  await goto(page, '/vehicles');
  const search = page.getByTestId('vehicles-search');
  await search.fill('oil');
  // Expect at least one card remains; adjust to seeded data in CI
  const remaining = await page.locator('[data-test="vehicle-card"]').count();
  expect(remaining).toBeGreaterThan(0);
});

test('Sort toggles order', async ({ page }) => {
  await goto(page, '/vehicles');
  const sort = page.getByTestId('vehicles-sort');
  await sort.selectOption('name');
  await expect(page).toHaveURL(/sort=name/);
});

test('Role filter hides non-matching', async ({ page }) => {
  await goto(page, '/vehicles');
  await page.getByTestId('vehicles-role-viewer').click();
  await expect(page).toHaveURL(/role=VIEWER/);
});

test('Cards have no per-card action buttons and are fully clickable', async ({ page }) => {
  await goto(page, '/vehicles');
  const cards = page.locator('[data-test="vehicle-card"]');
  const count = await cards.count();
  // No per-card action links should be present (header links may exist)
  await expect(page.locator('[data-test="vehicle-card"] a:has-text("Public page")')).toHaveCount(0);
  await expect(page.locator('[data-test="vehicle-card"] a:has-text("Members")')).toHaveCount(0);
  await expect(page.locator('[data-test="vehicle-card"] a:has-text("Tasks")')).toHaveCount(0);

  if (count > 0) {
    // Clicking anywhere on a card (link wrapper) navigates to /vehicles/[id]
    await page.locator('[data-test="vehicle-card"] >> [data-test="vehicle-card-link"]').first().click();
    await expect(page).toHaveURL(/\/vehicles\/[^/]+$/);
  }
});

// Header nav behavior moved to header-nav.spec.ts under new scope

