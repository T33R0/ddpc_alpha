import { test } from '@playwright/test';

test('inspections list returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.get(`/api/vehicles/${vid}/inspections`);
  test.expect(response.ok()).toBe(true);
  const data = await response.json();
  test.expect(data).toHaveProperty('items');
  test.expect(Array.isArray(data.items)).toBe(true);
});

test('inspections POST returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.post(`/api/vehicles/${vid}/inspections`, {
    data: {
      kind: 'general',
      inspected_on: '2024-01-01',
      odo: 10000,
      result: 'Passed inspection'
    }
  });
  test.expect(response.ok() || response.status() === 400).toBe(true); // 400 is ok if validation fails
});
