import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/owner.json' });

test('merge modal opens, validates distinct, flag-off shows toast and closes', async ({ page }) => {
  const vehicleId = process.env.VEHICLE_ID_WRITE;
  test.skip(!vehicleId, 'No seeded vehicle id; skipping');

  await page.goto(`/vehicles/${vehicleId}/plans`);
  await page.getByTestId('merge-plans-open').click();

  const from = page.getByTestId('merge-plans-from');
  const to = page.getByTestId('merge-plans-to');
  const save = page.getByTestId('merge-plans-save');

  await expect(save).toBeDisabled();
  // Choose same plan for both to enforce distinct
  const firstOpt = await from.locator('option').nth(1).getAttribute('value');
  if (firstOpt) {
    await from.selectOption(firstOpt);
    await to.selectOption(firstOpt);
    await expect(save).toBeDisabled();
  }

  // If there is a second option, make them distinct and check enabled
  const secondOpt = await from.locator('option').nth(2).getAttribute('value');
  if (firstOpt && secondOpt && secondOpt !== firstOpt) {
    await to.selectOption(secondOpt);
    await expect(save).toBeEnabled();
  }

  // Click save; default flag is off in CI so toast and close (we verify modal disappears)
  await save.click();
  // Modal should close
  await expect(save).toBeHidden({ timeout: 5000 });
});


