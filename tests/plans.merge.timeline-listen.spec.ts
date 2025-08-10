import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/owner.json' });

test('timeline listens for merge event and injects optimistic card', async ({ page }) => {
  const vehicleId = process.env.VEHICLE_ID_WRITE;
  test.skip(!vehicleId, 'No seeded vehicle id; skipping');

  await page.goto(`/vehicles/${vehicleId}/timeline`);

  // Dispatch the custom event in the page context
  await page.evaluate((vid) => {
    document.dispatchEvent(new CustomEvent('plan-merge-created', { detail: { vehicleId: vid, fromId: 'planA', toId: 'planB', title: 'Merge A to B' } }));
  }, vehicleId);

  const card = page.getByTestId('timeline-merge-optimistic').first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('Merge A to B');
});


