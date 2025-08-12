// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe.configure({ tag: ['@public', '@dashboard'] });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

test('Signed-out: dashboard hero and CTA visible @public', async ({ page }) => {
  await goto(page, '/');
  await expect(page.getByTestId('dashboard-hero')).toBeVisible();
  await expect(page.getByTestId('cta-signin-google')).toBeVisible();
});

const auth = STORAGE_STATE ? test.extend({
  storageState: async ({}, use) => { await use(STORAGE_STATE); },
}) : test.skip;

auth('Signed-in: widgets render @dashboard', async ({ page }) => {
  await goto(page, '/');
  await expect(page.getByTestId('dashboard-garage')).toBeVisible();
  await expect(page.getByTestId('dashboard-upcoming-tasks')).toBeVisible();
  await expect(page.getByTestId('dashboard-recent-events')).toBeVisible();
  await expect(page.getByTestId('dashboard-overdue-tasks')).toBeVisible();
  await expect(page.getByTestId('dashboard-recent-vehicles')).toBeVisible();
  await expect(page.getByTestId('dashboard-stat-vehicles')).toBeVisible();
  await expect(page.getByTestId('dashboard-stat-open-tasks')).toBeVisible();
  await expect(page.getByTestId('dashboard-stat-overdue')).toBeVisible();
  await expect(page.getByTestId('dashboard-quick-actions')).toBeVisible();
});


