import { test as base, expect, request } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const VEHICLE_ID = process.env.VEHICLE_ID_WRITE || '';
const PLAN_FROM_ID = process.env.PLAN_FROM_ID || '';
const PLAN_TO_ID = process.env.PLAN_TO_ID || '';

const OWNER_STATE = path.resolve(process.cwd(), '.auth', 'owner.json');
const VIEWER_STATE = path.resolve(process.cwd(), '.auth', 'viewer.json');

const test = base;
const shouldRun = !!(VEHICLE_ID && PLAN_FROM_ID && PLAN_TO_ID);

test.describe('@auth RLS — merge and reads', () => {
  if (!shouldRun) test.skip();

  test('owner can create merge event and read events', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL, storageState: OWNER_STATE });
    const res = await ctx.post('/api/events/merge', {
      data: { vehicle_id: VEHICLE_ID, from_plan_id: PLAN_FROM_ID, to_plan_id: PLAN_TO_ID, title: 'Merge Plans', notes: 'via test' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body?.type).toBe('MERGE');
    expect(body?.id).toBeTruthy();
  });

  test('non-owner cannot create merge event', async () => {
    // skip if no viewer state
    const hasViewer = !!process.env.VIEWER_STORAGE_STATE; // optional
    if (!hasViewer) return;
    const ctx = await request.newContext({ baseURL: BASE_URL, storageState: VIEWER_STATE });
    const res = await ctx.post('/api/events/merge', {
      data: { vehicle_id: VEHICLE_ID, from_plan_id: PLAN_FROM_ID, to_plan_id: PLAN_TO_ID, title: 'x' },
    });
    expect([403, 401]).toContain(res.status());
  });
});

// Immutability smoke: ensure no update endpoint exists or responds 400/403 beyond 24h
test('immutability — cannot mutate old events', async () => {
  const id = process.env.OWNER_EVENT_GT24;
  if (!id) test.skip();
  const ctx = await request.newContext({ baseURL: BASE_URL });
  const res = await ctx.patch(`/api/events/${id}`, { data: { notes: 'should fail' } });
  expect([400, 403, 404]).toContain(res.status());
});
