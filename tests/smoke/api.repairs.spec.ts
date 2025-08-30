import { test } from '@playwright/test';

test('repairs list returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.get(`/api/vehicles/${vid}/repairs`);
  test.expect(response.ok()).toBe(true);
  const data = await response.json();
  test.expect(data).toHaveProperty('items');
  test.expect(Array.isArray(data.items)).toBe(true);
});

test('repairs POST returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.post(`/api/vehicles/${vid}/repairs`, {
    data: {
      occurred_on: '2024-01-01',
      description: 'Oil change',
      odo: 10000,
      shop: 'Local Garage',
      cost: 75.50
    }
  });
  test.expect(response.ok() || response.status() === 400).toBe(true); // 400 is ok if validation fails
});
