// @ts-nocheck
import { test as base, expect } from '@playwright/test';

base.describe.configure({ tag: '@auth' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';
const VIEWER_STORAGE_STATE = process.env.VIEWER_STORAGE_STATE || '';
const VEHICLE_ID_WRITE = process.env.VEHICLE_ID_WRITE || process.env.PUBLIC_VEHICLE_ID || '';

const test = STORAGE_STATE && VEHICLE_ID_WRITE ? base.extend({
  storageState: async ({}, use) => { await use(STORAGE_STATE); },
}) : base.skip;

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

// If canWrite -> template quick-add creates a task; VIEWER sees disabled picker

test.describe('Templates quick-add @auth', () => {
  test('writer can quick-add a task from template @auth', async ({ page }) => {
    await goto(page, `/vehicles/${VEHICLE_ID_WRITE}/tasks`);

    const picker = page.locator('[data-test="template-quick-add"]');
    await expect(picker).toBeVisible();

    const search = picker.getByPlaceholder('Search templates…');
    await search.fill('oil');

    const select = picker.locator('select');
    await expect(select).toBeEnabled();

    // choose first matching option after placeholder
    const options = select.locator('option');
    const optCount = await options.count();
    expect(optCount).toBeGreaterThan(1);
    const firstTemplateValue = await options.nth(1).getAttribute('value');
    await select.selectOption(firstTemplateValue!);

    // Title should prefill; then submit
    const titleInput = page.locator('input').filter({ hasNot: page.locator('[type="date"]') }).first();
    await expect(titleInput).not.toHaveValue('');
    await page.getByRole('button', { name: /add/i }).click();

    // Expect a card/text to appear containing the title
    await expect(page.getByText(new RegExp(await titleInput.inputValue().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeVisible();
  });

  const viewerTest = VIEWER_STORAGE_STATE && VEHICLE_ID_WRITE ? base.extend({
    storageState: async ({}, use) => { await use(VIEWER_STORAGE_STATE); },
  }) : base.skip;

  viewerTest('viewer sees disabled template picker @auth', async ({ page }) => {
    await goto(page, `/vehicles/${VEHICLE_ID_WRITE}/tasks`);
    const picker = page.locator('[data-test="template-quick-add"]');
    await expect(picker).toBeVisible();
    const search = picker.getByPlaceholder('Search templates…');
    await expect(search).toBeDisabled();
    const select = picker.locator('select');
    await expect(select).toBeDisabled();
  });
});
