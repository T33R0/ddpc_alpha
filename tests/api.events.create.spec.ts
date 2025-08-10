import { test, expect, request } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OWNER_STATE = '.auth/owner.json';

// These IDs are provided by globalSetup via .tmp/test-env.json
const VEHICLE_ID = process.env.VEHICLE_ID as string;

test.describe('POST /api/events', () => {
  test.skip(!VEHICLE_ID, 'VEHICLE_ID not seeded');

  test('owner can create quick-add event', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL, storageState: OWNER_STATE });
    const res = await ctx.post('/api/events', {
      data: {
        vehicle_id: VEHICLE_ID,
        type: 'SERVICE',
        title: 'Oil change',
        notes: '5W-30',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body?.id).toBeTruthy();
    expect(body?.type).toBe('SERVICE');
    expect(body?.vehicle_id).toBe(VEHICLE_ID);
    expect(body?.occurred_at).toBeTruthy();
  });

  test('anonymous is unauthorized', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.post('/api/events', { data: { vehicle_id: VEHICLE_ID, type: 'NOTE', title: 'anon' } });
    expect(res.status()).toBe(401);
  });
});
