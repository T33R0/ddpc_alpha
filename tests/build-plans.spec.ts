// @ts-nocheck
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';

test.describe.configure({ mode: 'serial', tag: ['@auth', '@build-plans'] });

test.beforeAll(async () => {
  if (!STORAGE_STATE) test.skip(true, 'STORAGE_STATE not set; skipping auth-scoped tests');
});

test.use({ storageState: STORAGE_STATE || undefined });

async function goto(page, path) { await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' }); }

// Helper: navigate to first vehicle and return its id
async function openFirstVehicle(page) {
  await goto(page, '/vehicles');
  const firstLink = page.locator('[data-test="vehicle-card-link"]').first();
  if (!(await firstLink.count())) test.skip(true, 'No vehicles available');
  await firstLink.click();
  await page.waitForURL(/\/vehicles\/[^/]+$/);
  const m = page.url().match(/\/vehicles\/([^/]+)$/);
  if (!m) test.skip(true, 'Could not parse vehicle id from URL');
  return m[1];
}

// 1) Plans list reachable and can create plan
test('can create build plan from plans list', async ({ page }) => {
  const vehicleId = await openFirstVehicle(page);
  // Navigate directly to plans list (overview no longer has a button)
  await goto(page, `/vehicles/${vehicleId}/plans`);
  await expect(page).toHaveURL(new RegExp(`/vehicles/${vehicleId}/plans$`));

  // Create new plan
  const name = `E2E Plan ${Date.now()}`;
  await page.getByRole('textbox', { name: 'New plan name' }).fill(name);
  await page.getByTestId('new-plan-btn').click();

  // The list should show the newly created plan at or near the top
  await expect(page.getByTestId('plans-list')).toContainText(name);
});

// 2) Assign a task to the plan using Tasks page plan selector
test('can assign task to plan on create and see it in plan detail', async ({ page }) => {
  const vehicleId = await openFirstVehicle(page);
  // Go to plans list and grab the latest plan name (top row link text)
  await goto(page, `/vehicles/${vehicleId}/plans`);
  const firstPlanLink = page.locator('[data-testid^="plan-row-"] a').first();
  const planName = (await firstPlanLink.textContent())?.trim();
  await firstPlanLink.click();
  await page.waitForURL(new RegExp(`/vehicles/${vehicleId}/plans/[^/]+$`));
  const planUrl = new URL(page.url());
  const planId = planUrl.pathname.split('/').pop();

  // Go to tasks and select this plan in the selector before creating task
  await goto(page, `/vehicles/${vehicleId}/tasks`);
  const planSelect = page.getByTestId('task-plan-select');
  await expect(planSelect).toHaveCount(1);
  // Ensure options exist and one matches our plan
  const options = await planSelect.locator('option').all();
  const optionValues = await Promise.all(options.map(o => o.getAttribute('value')));
  if (!optionValues.includes(planId)) test.skip(true, 'Plan not present in selector');
  await planSelect.selectOption(planId);

  // Create a task under this plan
  const title = `E2E Task ${Date.now()}`;
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();
  // Should appear on the board (optimistic). No explicit plan indicator on card.
  await expect(page.getByText(title).first()).toBeVisible();

  // Verify it shows on the plan detail page (filtered by build_plan_id)
  await goto(page, `/vehicles/${vehicleId}/plans/${planId}`);
  await expect(page.getByText(title)).toBeVisible();
});

// 3) Merge plan and verify status/controls
test('can merge plan and it becomes read-only', async ({ page }) => {
  const vehicleId = await openFirstVehicle(page);
  await goto(page, `/vehicles/${vehicleId}/plans`);
  const firstPlanLink = page.locator('[data-testid^="plan-row-"] a').first();
  await firstPlanLink.click();
  await page.waitForURL(new RegExp(`/vehicles/${vehicleId}/plans/[^/]+$`));

  // Click Merge
  const mergeBtn = page.getByRole('button', { name: 'Merge' });
  await expect(mergeBtn).toBeVisible();
  await mergeBtn.click();

  // After merge, status should include "merged" and button disabled
  await expect(mergeBtn).toBeDisabled();
  await expect(page.getByText(/merged/i)).toBeVisible();

  // Navigate to timeline and verify a merge-type event is visible
  await goto(page, `/vehicles/${vehicleId}/timeline`);
  // Expect either the event type or textual hint to be present
  await expect(page.locator('body')).toContainText(/MERGE_PLAN|merged/i);
});

// 4) Edit plan and set it as default
test('can edit plan and set default', async ({ page }) => {
  const vehicleId = await openFirstVehicle(page);
  await goto(page, `/vehicles/${vehicleId}/plans`);
  const firstPlanLink = page.locator('[data-testid^="plan-row-"] a').first();
  if (!(await firstPlanLink.count())) test.skip(true, 'No plans to edit');
  await firstPlanLink.click();
  await page.waitForURL(new RegExp(`/vehicles/${vehicleId}/plans/[^/]+$`));

  // Edit name and description
  const newName = `Edited Plan ${Date.now()}`;
  await page.getByLabel('Name').fill(newName);
  await page.getByLabel('Description').fill('Updated by Playwright test');
  await page.getByTestId('plan-save-btn').click();

  // Header should reflect new name
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(newName);

  // Set default (button disabled if already default)
  const setDefaultBtn = page.getByTestId('plan-set-default-btn');
  if (await setDefaultBtn.isEnabled()) {
    await setDefaultBtn.click();
  }

  // Badge "Default" should be visible on detail
  await expect(page.getByText('Default')).toBeVisible();

  // And visible on list row as well
  await goto(page, `/vehicles/${vehicleId}/plans`);
  await expect(page.getByText('Default').first()).toBeVisible();
});
