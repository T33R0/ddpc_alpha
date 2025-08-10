import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/owner.json' });

test('New task defaults to vehicle default plan', async ({ page }) => {
  const vehicleId = process.env.VEHICLE_ID_WRITE;
  test.skip(!vehicleId, 'No seeded vehicle id; skipping');

  await page.goto(`/vehicles/${vehicleId}/tasks`);

  // If a default plan exists, its name should appear after create.
  // Fill form
  await page.getByLabel('Title').fill('Plan-aware task');
  await page.getByRole('button', { name: 'Add' }).click();

  // Assert a card with the plan pill is visible for the new task soon
  const pill = page.getByTestId('task-plan-pill').first();
  await expect(pill).toBeVisible();
});


