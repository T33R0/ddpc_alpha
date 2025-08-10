import { test, expect } from '@playwright/test';

test.describe.configure({ tag: '@theme' });

test('CSS variables exist on :root and dark theme', async ({ page }) => {
  await page.goto('/');
  const tokens = ['--bg','--fg','--card','--muted','--brand','--ring'];
  // Check :root
  const rootStyles = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      bg: style.getPropertyValue('--bg').trim(),
      fg: style.getPropertyValue('--fg').trim(),
      card: style.getPropertyValue('--card').trim(),
      muted: style.getPropertyValue('--muted').trim(),
      brand: style.getPropertyValue('--brand').trim(),
      ring: style.getPropertyValue('--ring').trim(),
    };
  });
  for (const k of Object.keys(rootStyles)) expect((rootStyles as any)[k]).not.toBe('');

  // Check dark
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  const darkStyles = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      bg: style.getPropertyValue('--bg').trim(),
      fg: style.getPropertyValue('--fg').trim(),
      card: style.getPropertyValue('--card').trim(),
      muted: style.getPropertyValue('--muted').trim(),
      brand: style.getPropertyValue('--brand').trim(),
      ring: style.getPropertyValue('--ring').trim(),
    };
  });
  for (const k of Object.keys(darkStyles)) expect((darkStyles as any)[k]).not.toBe('');
});


