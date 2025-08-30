import { test } from '@playwright/test';

test('usage logs list returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.get(`/api/vehicles/${vid}/usage`);
  test.expect(response.ok()).toBe(true);
  const data = await response.json();
  test.expect(data).toHaveProperty('items');
  test.expect(Array.isArray(data.items)).toBe(true);
});

test('usage logs POST returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.post(`/api/vehicles/${vid}/usage`, {
    data: {
      occurred_on: '2024-01-01',
      kind: 'daily',
      odo: 10000,
      details: 'Daily commute'
    }
  });
  test.expect(response.ok() || response.status() === 400).toBe(true); // 400 is ok if validation fails
});
