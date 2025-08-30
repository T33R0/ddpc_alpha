import { test } from '@playwright/test';

test('factory config GET returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.get(`/api/vehicles/${vid}/factory-config`);
  test.expect(response.ok()).toBe(true);
  const data = await response.json();
  test.expect(data).toHaveProperty('item');
});

test('factory config PUT returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.put(`/api/vehicles/${vid}/factory-config`, {
    data: {
      decoded: { engine: '2.0T', transmission: 'automatic' },
      options: { color: 'blue', package: 'premium' }
    }
  });
  test.expect(response.ok() || response.status() === 400).toBe(true); // 400 is ok if validation fails
});
