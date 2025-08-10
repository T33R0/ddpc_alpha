// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
async function goto(page, path) { await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }); }

// Public smoke (works for anonymous; zero-state allowed)
test.describe.configure({ tag: ['@public', '@combined'] });

test('Home → Timeline: /timeline, filter visible, list or zero-state', async ({ page }) => {
  await goto(page, '/');
  await page.locator('[data-testid="nav-timeline"]').click();
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(page.getByTestId('filter-vehicle')).toBeVisible();
  // Either list or zero-state text
  const list = page.getByTestId('timeline-list');
  const zero = page.getByText(/Pick a vehicle|No events found/i);
  expect((await list.count()) > 0 || (await zero.count()) > 0).toBeTruthy();
});

test('Home → Tasks: /tasks, filter visible, list or zero-state', async ({ page }) => {
  await goto(page, '/');
  await page.locator('[data-testid="nav-tasks"]').press('Enter');
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByTestId('filter-vehicle')).toBeVisible();
  // Either list or zero-state
  const list = page.getByTestId('tasks-list');
  const zero = page.getByText(/Pick a vehicle|No tasks found/i);
  expect((await list.count()) > 0 || (await zero.count()) > 0).toBeTruthy();
});

// If auth storage state is provided, verify vehicle filter updates URL
const STORAGE_STATE = process.env.STORAGE_STATE || '';
const authtest = STORAGE_STATE ? test.extend({ storageState: async ({}, use) => { await use(STORAGE_STATE); } }) : test.skip;

authtest('Selecting a vehicle filters results and adds ?vehicleId=', async ({ page }) => {
  await goto(page, '/timeline');
  const filter = page.getByTestId('filter-vehicle');
  const before = page.url();
  // Try select first non-empty option if exists
  const options = await filter.locator('option').all();
  if (options.length > 1) {
    const val = await options[1].getAttribute('value');
    await filter.selectOption(val!);
    await expect(page).toHaveURL(/vehicleId=/);
    await expect(page.getByTestId('filter-announcer')).toBeVisible();
  } else {
    test.skip(true, 'No vehicle options available to select');
  }
});

authtest('From vehicle page, header links stay scoped (no query string)', async ({ page }) => {
  await goto(page, '/vehicles');
  const card = page.locator('[data-test="vehicle-card-link"]').first();
  if (await card.count()) {
    await card.click();
    await page.locator('[data-testid="nav-timeline"]').click();
    await expect(page).toHaveURL(/\/vehicles\/[^/]+\/timeline$/);
    await page.locator('[data-testid="nav-tasks"]').click();
    await expect(page).toHaveURL(/\/vehicles\/[^/]+\/tasks$/);
  } else {
    test.skip(true, 'No vehicles available');
  }
});
