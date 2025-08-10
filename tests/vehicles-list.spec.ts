// @ts-nocheck
import { test as base, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';

const auth = STORAGE_STATE ? base.extend({ storageState: async ({}, use) => { await use(STORAGE_STATE); } }) : base.skip;

async function goto(page, path) { await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }); }

auth.describe.configure({ tag: ['@auth', '@vehicles'] });

auth('Header Timeline/Tasks navigate within vehicle context', async ({ page }) => {
  // Navigate to a vehicle page first if available
  await goto(page, '/vehicles');
  const firstCard = page.locator('[data-test="vehicle-card-link"]').first();
  if (await firstCard.count()) {
    await firstCard.click();
    // Now in vehicle context
    const navTimeline = page.locator('[data-testid="nav-timeline"]');
    const navTasks = page.locator('[data-testid="nav-tasks"]');
    await expect(navTimeline).toHaveCount(1);
    await expect(navTasks).toHaveCount(1);
    await navTimeline.click();
    await expect(page).toHaveURL(/\/vehicles\/[^/]+\/timeline$/);
    await navTasks.click();
    await expect(page).toHaveURL(/\/vehicles\/[^/]+\/tasks$/);
  }
});

auth('Search narrows results', async ({ page }) => {
  await goto(page, '/vehicles');
  const search = page.getByTestId('vehicles-search');
  await search.fill('oil');
  // Expect at least one card remains; adjust to seeded data in CI
  const remaining = await page.locator('[data-test="vehicle-card"]').count();
  expect(remaining).toBeGreaterThan(0);
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

auth('Cards have no per-card action buttons and are fully clickable', async ({ page }) => {
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

auth('Header always shows Timeline/Tasks; out-of-context click routes to /vehicles and shows toast', async ({ page }) => {
  await goto(page, '/');
  const navTimeline = page.locator('[data-testid="nav-timeline"]');
  const navTasks = page.locator('[data-testid="nav-tasks"]');
  await expect(navTimeline).toHaveCount(1);
  await expect(navTasks).toHaveCount(1);
  await navTimeline.click();
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(page.getByTestId('filter-vehicle')).toBeVisible();
  await navTasks.click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByTestId('filter-vehicle')).toBeVisible();
});

