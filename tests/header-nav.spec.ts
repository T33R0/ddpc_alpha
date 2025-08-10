// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
async function goto(page, path) { await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }); }

test.describe.configure({ tag: ['@public'] });

test('Header always shows Timeline/Tasks (public)', async ({ page }) => {
  await goto(page, '/');
  const navTimeline = page.locator('[data-test="nav-timeline"]');
  const navTasks = page.locator('[data-test="nav-tasks"]');
  await expect(navTimeline).toHaveCount(1);
  await expect(navTasks).toHaveCount(1);
});

test('Out-of-context click routes to /vehicles and shows toast (public)', async ({ page }) => {
  await goto(page, '/');
  await page.locator('[data-test="nav-timeline"]').click();
  await expect(page).toHaveURL(/\/vehicles$/);
  await expect(page.getByText('Pick a vehicle to view Timeline/Tasks.')).toBeVisible();
  await page.locator('[data-test="nav-tasks"]').click();
  await expect(page).toHaveURL(/\/vehicles$/);
  await expect(page.getByText('Pick a vehicle to view Timeline/Tasks.')).toBeVisible();
});
