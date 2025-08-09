// @ts-nocheck
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
// Optional URLs to hit that will authenticate the browser context for each role.
// Example: a dev/mock login endpoint that sets auth cookies: /api/test/login?role=OWNER
const OWNER_LOGIN_URL = process.env.OWNER_LOGIN_URL || process.env.AUTH_BOOTSTRAP_URL_OWNER || '';
const MANAGER_LOGIN_URL = process.env.MANAGER_LOGIN_URL || process.env.AUTH_BOOTSTRAP_URL_MANAGER || '';
const VIEWER_LOGIN_URL = process.env.VIEWER_LOGIN_URL || process.env.AUTH_BOOTSTRAP_URL_VIEWER || '';

const AUTH_DIR = path.resolve(process.cwd(), '.auth');

async function doLoginAndSave(page, loginUrl, outfile) {
  await page.goto(loginUrl.startsWith('http') ? loginUrl : `${BASE_URL}${loginUrl}`, { waitUntil: 'domcontentloaded' });
  // Heuristic: after login, landing page should render body
  await expect(page.locator('body')).toBeVisible();
  await page.context().storageState({ path: outfile });
}

test.describe.configure({ tag: '@auth' });

// Generates .auth/*.json if dev/mock login URLs are provided via env.
// Skips gracefully in environments without login stubs.
test('bootstrap auth storage states', async ({ page, browser }) => {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR);

  let wroteAny = false;

  if (OWNER_LOGIN_URL) {
    await doLoginAndSave(page, OWNER_LOGIN_URL, path.join(AUTH_DIR, 'owner.json'));
    wroteAny = true;
  }

  if (MANAGER_LOGIN_URL) {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await doLoginAndSave(p, MANAGER_LOGIN_URL, path.join(AUTH_DIR, 'manager.json'));
    await ctx.close();
    wroteAny = true;
  }

  if (VIEWER_LOGIN_URL) {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await doLoginAndSave(p, VIEWER_LOGIN_URL, path.join(AUTH_DIR, 'viewer.json'));
    await ctx.close();
    wroteAny = true;
  }

  test.info().annotations.push({ type: 'note', description: wroteAny ? 'Auth states generated' : 'No login URLs provided; skipped' });
  expect(true).toBe(true);
});
