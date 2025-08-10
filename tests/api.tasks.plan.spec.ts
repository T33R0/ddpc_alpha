import { test, expect, request } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OWNER_STATE = '.auth/owner.json';

const TASK_ID = process.env.WORK_ITEM_ID as string;
const PLAN_TO_ID = process.env.PLAN_TO_ID as string;

test.describe('PATCH /api/work-items/[id]/plan', () => {
  test.skip(!TASK_ID || !PLAN_TO_ID, 'WORK_ITEM_ID or PLAN_TO_ID not seeded');

  test('owner can move task to another plan', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL, storageState: OWNER_STATE });
    const res = await ctx.patch(`/api/work-items/${TASK_ID}/plan`, {
      data: { plan_id: PLAN_TO_ID },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
  });

  test('anonymous is unauthorized', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.patch(`/api/work-items/${TASK_ID}/plan`, { data: { plan_id: PLAN_TO_ID } });
    expect(res.status()).toBe(401);
  });
});
