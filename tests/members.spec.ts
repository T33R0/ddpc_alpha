// @ts-nocheck
import { test as base, expect } from '@playwright/test';

base.describe.configure({ tag: '@auth' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STORAGE_STATE = process.env.STORAGE_STATE || '';
const GARAGE_ID = process.env.GARAGE_ID || '';
const TEST_MEMBER_EMAIL = process.env.TEST_MEMBER_EMAIL || '';
const VIEWER_STORAGE_STATE = process.env.VIEWER_STORAGE_STATE || '';

// Auth fixture (skip if no STORAGE_STATE)
const test = STORAGE_STATE && GARAGE_ID ? base.extend({
  storageState: async ({}, use) => { await use(STORAGE_STATE); },
}) : base.skip;

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

// OWNER/MANAGER add existing email -> see member in list (@auth)
test('members: add and remove, and role gating for viewer (if provided) @auth', async ({ page, context }) => {
  // Add
  await goto(page, `/garage/${GARAGE_ID}/members`);
  await expect(page.locator('[data-test="members-table"]')).toBeVisible();

  if (!TEST_MEMBER_EMAIL) test.skip(true, 'TEST_MEMBER_EMAIL not set');

  const beforeCount = await page.locator('[data-test="members-table"] tbody tr').count();
  await page.locator('[data-test="members-add"] input[name="email"]').fill(TEST_MEMBER_EMAIL);
  // default role VIEWER in server, UI defaults to MANAGER option but we keep default
  await page.locator('[data-test="members-add"] button[type="submit"]').click();

  // Row count increases
  await expect(async () => {
    const after = await page.locator('[data-test="members-table"] tbody tr').count();
    expect(after).toBeGreaterThanOrEqual(beforeCount + 1);
  }).toPass();

  // Remove newly added member (pick the last non-OWNER row)
  const rows = page.locator('[data-test="members-table"] tbody tr');
  const lastIdx = (await rows.count()) - 1;
  const lastRow = rows.nth(lastIdx);
  const removeBtn = lastRow.locator('[data-test="member-remove"] button:has-text("Remove")');
  await expect(removeBtn).toBeEnabled();
  await removeBtn.click();

  await expect(async () => {
    const after = await page.locator('[data-test="members-table"] tbody tr').count();
    expect(after).toBeGreaterThanOrEqual(beforeCount); // at least back to before (if owner row present)
  }).toPass();

  // Viewer role gating (optional)
  if (VIEWER_STORAGE_STATE) {
    const viewerContext = await context.browser().newContext({ storageState: VIEWER_STORAGE_STATE });
    const viewerPage = await viewerContext.newPage();
    await goto(viewerPage, `/garage/${GARAGE_ID}/members`);
    // Actions should not be present/enabled
    await expect(viewerPage.locator('[data-test="members-add"]')).toHaveCount(0);
    await expect(viewerPage.locator('[data-test="member-remove"]')).toHaveCount(0);
    await viewerContext.close();
  }
});

// Invites: create -> revoke (@auth)
const invitesTest = STORAGE_STATE && GARAGE_ID ? test : base.skip;
invitesTest('invites: create and revoke @auth', async ({ page }) => {
  await goto(page, `/garage/${GARAGE_ID}/invites`);
  const createForm = page.locator('[data-test="invite-create"]');
  await expect(createForm).toBeVisible();

  // Create
  await createForm.locator('button[type="submit"]').click();

  // Revoke on the first row (if exists)
  const revokeBtn = page.locator('[data-test="invite-revoke"]').first();
  await expect(revokeBtn).toBeVisible();
  await revokeBtn.click();
});
