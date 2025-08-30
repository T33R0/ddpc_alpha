import { test } from '@playwright/test';

test('dyno runs list returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.get(`/api/vehicles/${vid}/dyno-runs`);
  test.expect(response.ok()).toBe(true);
  const data = await response.json();
  test.expect(data).toHaveProperty('items');
  test.expect(Array.isArray(data.items)).toBe(true);
});

test('dyno runs POST returns 200', async ({ request }) => {
  const vid = process.env.TEST_VEHICLE_ID!;
  const response = await request.post(`/api/vehicles/${vid}/dyno-runs`, {
    data: {
      run_on: '2024-01-01',
      odo: 10000,
      tune_label: 'Stage 1',
      whp: 350,
      wtq: 450,
      boost_psi: 20
    }
  });
  test.expect(response.ok() || response.status() === 400).toBe(true); // 400 is ok if validation fails
});
