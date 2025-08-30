import { test } from '@playwright/test';

test('mods list returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.get(`/api/vehicles/${vid}/mods`);
  test.expect(response.ok()).toBe(true);
  const data = await response.json();
  test.expect(data).toHaveProperty('items');
  test.expect(Array.isArray(data.items)).toBe(true);
});
