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

auth('Signed-in: KPI strip, upcoming, activity and charts render @dashboard', async ({ page }) => {
  await goto(page, '/');
  await expect(page.getByTestId('kpi-vehicles')).toBeVisible();
  await expect(page.getByTestId('kpi-open-tasks')).toBeVisible();
  await expect(page.getByTestId('kpi-next-due')).toBeVisible();
  await expect(page.getByTestId('kpi-spend-ytd')).toBeVisible();
  await expect(page.getByTestId('kpi-miles-ytd')).toBeVisible();
  await expect(page.getByTestId('kpi-health')).toBeVisible();
  await expect(page.getByTestId('upcoming-list')).toBeVisible();
  await expect(page.getByTestId('activity-feed')).toBeVisible();
  await expect(page.getByTestId('chart-spend')).toBeVisible();
  await expect(page.getByTestId('chart-miles')).toBeVisible();
});


