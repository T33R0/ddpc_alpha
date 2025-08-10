// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
async function goto(page, path) { await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }); }

test.describe.configure({ tag: ['@public'] });

test('Header shows Garage and no Timeline/Tasks (public)', async ({ page }) => {
  await goto(page, '/');
  await expect(page.locator('[data-testid="nav-garage"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="nav-timeline"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="nav-tasks"]')).toHaveCount(0);
});

test('Visiting /timeline or /tasks redirects to / (public)', async ({ page }) => {
  await goto(page, '/timeline');
  await expect(page).toHaveURL(/\/$/);
  await goto(page, '/tasks');
  await expect(page).toHaveURL(/\/$/);
});
