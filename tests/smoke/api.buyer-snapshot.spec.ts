import { test } from '@playwright/test';

test('buyer snapshot returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.get(`/api/vehicles/${vid}/buyer-snapshot`);
  test.expect(response.ok()).toBe(true);
  const data = await response.json();
  test.expect(data).toHaveProperty('item');
});
