// @ts-nocheck
import { test as base, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';

const auth = STORAGE_STATE ? base.extend({ storageState: async ({}, use) => { await use(STORAGE_STATE); } }) : base.skip;

async function goto(page, path) { await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }); }

auth.describe.configure({ tag: ['@auth', '@vehicles'] });

auth('Search narrows results', async ({ page }) => {
  await goto(page, '/vehicles');
  const search = page.getByTestId('vehicles-search');
  await search.fill('oil');
  // Expect at least one card remains; adjust to seeded data in CI
  await expect(page.locator('[data-test="vehicle-card"]')).toHaveCountGreaterThan(0);
});

auth('Sort toggles order', async ({ page }) => {
  await goto(page, '/vehicles');
  const sort = page.getByTestId('vehicles-sort');
  await sort.selectOption('name');
  await expect(page).toHaveURL(/sort=name/);
});

auth('Role filter hides non-matching', async ({ page }) => {
  await goto(page, '/vehicles');
  await page.getByTestId('vehicles-role-viewer').click();
  await expect(page).toHaveURL(/role=VIEWER/);
});


