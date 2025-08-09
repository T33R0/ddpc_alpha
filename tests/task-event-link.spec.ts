// @ts-nocheck
import { test as base, expect } from '@playwright/test';

base.describe.configure({ tag: '@auth' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';
const VIEWER_STORAGE_STATE = process.env.VIEWER_STORAGE_STATE || '';
const VEHICLE_ID_WRITE = process.env.VEHICLE_ID_WRITE || process.env.PUBLIC_VEHICLE_ID || '';
const SERVER_ENABLE_LINK = process.env.ENABLE_TASK_EVENT_LINK === 'true';

// Auth project for writer
const test = STORAGE_STATE && VEHICLE_ID_WRITE ? base.extend({
  storageState: async ({}, use) => { await use(STORAGE_STATE); },
}) : base.skip;

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

// Skip the writer tests entirely if server does not allow linking (nothing to assert)
const writerSuite = SERVER_ENABLE_LINK ? test.describe : test.describe.skip;

writerSuite('Task completion → optional Timeline event @auth', () => {
  test.beforeEach(async ({ page }) => {
    // Enable client flag via localStorage for e2e; server may still gate linking
    await page.addInitScript(() => {
      try { window.localStorage.setItem('e2e_enable_task_event_link', '1'); } catch {}
    });
  });

  test('Complete with log checked creates event visible in Timeline @auth', async ({ page }) => {
    await goto(page, `/vehicles/${VEHICLE_ID_WRITE}/tasks`);

    // Create a unique task in BACKLOG
    const note = `E2E Link ${Date.now()}`;
    await page.getByLabel('Title').fill(note);
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText(note)).toBeVisible();

    // Move to DONE → opens Complete modal (flag enabled client-side)
    // Click the inline status action button "→ DONE" on that card
    await page.getByRole('button', { name: /→ done/i }).first().click();

    const modal = page.locator('[data-test="task-complete-modal"]');
    await expect(modal).toBeVisible();

    // Ensure checkbox is checked by default; leave it checked
    const chk = modal.locator('[data-test="task-complete-log-checkbox"]');
    await expect(chk).toBeChecked();

    // Submit
    await modal.getByRole('button', { name: /complete/i }).click();
    await expect(modal).toBeHidden();

    // Navigate to Timeline and confirm event appears (look for text match)
    await goto(page, `/vehicles/${VEHICLE_ID_WRITE}/timeline`);
    await expect(page.getByText(note)).toBeVisible();

    // Badge should be present for linked events
    await expect(page.getByText('from task').first()).toBeVisible();
  });

  test('Complete with log UNchecked does not create event @auth', async ({ page }) => {
    await goto(page, `/vehicles/${VEHICLE_ID_WRITE}/tasks`);

    const note = `E2E NoLink ${Date.now()}`;
    await page.getByLabel('Title').fill(note);
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText(note)).toBeVisible();

    // Move to DONE and uncheck logging
    await page.getByRole('button', { name: /→ done/i }).first().click();
    const modal = page.locator('[data-test="task-complete-modal"]');
    await expect(modal).toBeVisible();
    const chk = modal.locator('[data-test="task-complete-log-checkbox"]');
    await chk.uncheck();
    await modal.getByRole('button', { name: /complete/i }).click();
    await expect(modal).toBeHidden();

    // Go to timeline; event should not exist
    await goto(page, `/vehicles/${VEHICLE_ID_WRITE}/timeline`);
    await expect(page.getByText(note)).toHaveCount(0);
  });
});

// Separate project for VIEWER
const viewerTest = VIEWER_STORAGE_STATE && VEHICLE_ID_WRITE ? base.extend({
  storageState: async ({}, use) => { await use(VIEWER_STORAGE_STATE); },
}) : base.skip;

viewerTest('Viewer role has no Complete affordance @auth', async ({ page }) => {
  await page.addInitScript(() => {
    try { window.localStorage.setItem('e2e_enable_task_event_link', '1'); } catch {}
  });
  await goto(page, `/vehicles/${VEHICLE_ID_WRITE}/tasks`);
  // Viewer cannot write; verify move buttons are disabled or absent
  // We expect at least one task card; check that any "→ DONE" button is disabled
  const moveButtons = page.getByRole('button', { name: /→ done/i });
  const count = await moveButtons.count();
  for (let i = 0; i < count; i++) {
    await expect(moveButtons.nth(i)).toBeDisabled();
  }
});


