import { test as base, expect, request } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const VEHICLE_ID = process.env.VEHICLE_ID_WRITE || '';

const OWNER_STATE = path.resolve(process.cwd(), '.auth', 'owner.json');
const VIEWER_STATE = path.resolve(process.cwd(), '.auth', 'viewer.json');

const test = base;
const hasVehicle = !!VEHICLE_ID;

test.describe('@auth RLS — owner vs non-owner reads', () => {
  if (!hasVehicle) test.skip();

  test('owner can read private vehicle page and CSV', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL, storageState: OWNER_STATE });
    const pageRes = await ctx.get(`/vehicles/${VEHICLE_ID}`);
    expect(pageRes.status()).toBe(200);
    const csvRes = await ctx.get(`/api/vehicles/${VEHICLE_ID}/events.csv`);
    expect(csvRes.status()).toBe(200);
  });

  test('non-owner cannot read private vehicle page and CSV', async () => {
    if (!fs.existsSync(VIEWER_STATE)) return; // tolerate missing viewer state
    const ctx = await request.newContext({ baseURL: BASE_URL, storageState: VIEWER_STATE });
    const pageRes = await ctx.get(`/vehicles/${VEHICLE_ID}`);
    expect([401, 403, 404]).toContain(pageRes.status());
    const csvRes = await ctx.get(`/api/vehicles/${VEHICLE_ID}/events.csv`);
    expect([401, 403, 404]).toContain(csvRes.status());
  });
});
