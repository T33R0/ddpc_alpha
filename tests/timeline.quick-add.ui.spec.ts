import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/owner.json' });

test('Timeline quick-add renders, disables until valid, optimistic add appears', async ({ page }) => {
  const vehicleId = process.env.VEHICLE_ID_WRITE;
  test.skip(!vehicleId, 'No seeded vehicle id; skipping');

  await page.goto(`/vehicles/${vehicleId}/timeline`);

  const form = page.getByTestId('timeline-quick-add-form');
  await expect(form).toBeVisible();

  const title = page.getByTestId('timeline-quick-add-title');
  const save = page.getByTestId('timeline-quick-add-save');

  await expect(save).toBeDisabled();
  await title.fill('Change oil');
  await expect(save).toBeEnabled();

  await save.click();

  // expect an optimistic card to appear quickly (created_at label area will exist)
  await expect(page.getByText('Change oil').first()).toBeVisible();

  // When flag is off (default in CI), optimistic card should be removed
  await expect.poll(async () => {
    const count = await page.getByText('Change oil').count();
    return count;
  }).toBeLessThan(2); // eventually only historical items remain (optimistic removed)
});


