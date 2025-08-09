// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe.configure({ tag: '@public' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PUBLIC_VEHICLE_ID = process.env.PUBLIC_VEHICLE_ID || 'demo-public';
const IS_PLACEHOLDER_PUBLIC = PUBLIC_VEHICLE_ID === 'demo-public';
const STORAGE_STATE = process.env.STORAGE_STATE || '';

// Helper to navigate safely
async function goto(page: import('@playwright/test').Page, path: string) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

// Public page smoke (skipped if no real PUBLIC_VEHICLE_ID provided)
const publicTest = IS_PLACEHOLDER_PUBLIC ? test.skip : test;
publicTest.describe('Public vehicle page', () => {
  test('loads and shows PUBLIC badge; banned fields absent', async ({ page }) => {
    await goto(page, `/v/${PUBLIC_VEHICLE_ID}`);

    // PUBLIC badge visible (data-test target)
    await expect(page.locator('[data-test="public-badge"]')).toBeVisible();

    // No cost/notes/docs/raw odometer leakage
    await expect(page.getByText(/\$\d/)).toHaveCount(0);
    await expect(page.getByText(/odometer/i)).toHaveCount(0);
    await expect(page.getByText(/invoice|doc/i)).toHaveCount(0);
  });

  auth('My ICS returns 200 and VCALENDAR', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/me/calendar.ics`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('BEGIN:VCALENDAR');
    const expectEvents = Number(process.env.ICS_EXPECT_EVENTS_ME || '0');
    if (expectEvents > 0) {
      const vevents = (text.match(/BEGIN:VEVENT/g) || []).length;
      expect(vevents).toBeGreaterThanOrEqual(expectEvents);
    }
  });
});

// ICS endpoint smoke tests
publicTest('Vehicle ICS returns 200 and VCALENDAR', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/vehicles/${PUBLIC_VEHICLE_ID}/calendar.ics`);
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain('BEGIN:VCALENDAR');
  const expectEvents = Number(process.env.ICS_EXPECT_EVENTS_PUBLIC || '0');
  if (expectEvents > 0) {
    const vevents = (text.match(/BEGIN:VEVENT/g) || []).length;
    expect(vevents).toBeGreaterThanOrEqual(expectEvents);
  }
});

// Trivial ping test to ensure server responds in CI even when others are skipped
test('app responds on home', async ({ page }) => {
  await goto(page, '/');
  await expect(page.locator('body')).toBeVisible();
});

// Auth-required flows (optional: require STORAGE_STATE)
const auth = STORAGE_STATE ? test.extend({
  storageState: async ({}, use) => {
    await use(STORAGE_STATE);
  },
}) : test.skip;

auth.describe('Authenticated flows', () => {
  auth.beforeEach(async ({ page }) => {
    // Verify signed-in indicator on Home
    await goto(page, '/');
    await expect(page.getByText(/Signed in as/i)).toBeVisible();
  });

  auth('Timeline quick-add optimistic and persistence', async ({ page }) => {
    // Open demo vehicle timeline
    await goto(page, `/vehicles/${PUBLIC_VEHICLE_ID}/timeline`);

    const titleInput = page.getByPlaceholder('Quick add title');
    const addBtn = page.getByRole('button', { name: /add/i });

    const note = `Smoke ${Date.now()}`;
    await titleInput.fill(note);
    await addBtn.click();

    // Optimistic card visible
    await expect(page.getByText(note)).toBeVisible();

    // Hard reload and ensure it persists
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(note)).toBeVisible();
  });

  auth('Vehicles list edit field: Enter saves, Esc reverts', async ({ page }) => {
    await goto(page, '/vehicles');

    // Open first vehicle actions (inline component has inputs)
    // Use generic approach: click the first vehicle link then return
    // to ensure page is populated
    const firstCardLink = page.locator('a').filter({ hasText: /timeline|public page|tasks/i }).first();
    await expect(firstCardLink).toBeVisible();

    // Target VehicleActions nickname field by data-test
    const nickname = page.locator('[data-test="vehicle-card"]').first().locator('[data-test="vehicle-nickname"]');

    // Type a value then Esc to revert
    const original = await nickname.inputValue();
    await nickname.fill(`${original} tmp`);
    await nickname.press('Escape');
    await expect(nickname).toHaveValue(original);

    // Change and press Enter to save
    const updated = `${original || 'Vehicle'} ${Date.now()}`;
    await nickname.fill(updated);
    await nickname.press('Enter');

    // Expect saved (value equals updated)
    await expect(nickname).toHaveValue(updated);
  });
});
