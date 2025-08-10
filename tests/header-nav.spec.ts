// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
async function goto(page, path) { await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }); }

test.describe.configure({ tag: ['@public'] });

test('Header always shows Timeline/Tasks (public)', async ({ page }) => {
  await goto(page, '/');
  const navTimeline = page.locator('[data-testid="nav-timeline"]');
  const navTasks = page.locator('[data-testid="nav-tasks"]');
  await expect(navTimeline).toHaveCount(1);
  await expect(navTasks).toHaveCount(1);
});

test('Out-of-context click routes to combined pages (public)', async ({ page }) => {
  await goto(page, '/');
  await page.locator('[data-testid="nav-timeline"]').press('Enter');
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(page.getByTestId('filter-vehicle')).toBeVisible();
  await page.locator('[data-testid="nav-tasks"]').click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByTestId('filter-vehicle')).toBeVisible();
});
