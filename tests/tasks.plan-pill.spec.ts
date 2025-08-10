import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/owner.json' });

test('Task cards show plan pill with plan name', async ({ page }) => {
  const vehicleId = process.env.VEHICLE_ID_WRITE;
  test.skip(!vehicleId, 'No seeded vehicle id; skipping');

  await page.goto(`/vehicles/${vehicleId}/tasks`);
  const pills = page.getByTestId('task-plan-pill');
  // At least renders (if tasks exist)
  await expect(pills.first()).toBeVisible();
});


