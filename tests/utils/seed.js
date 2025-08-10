// Deterministic seed for CI. Skips when required envs are missing.
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY_CI
// Emits a JSON blob at .tmp/test-env.json with PUBLIC_VEHICLE_ID, VEHICLE_ID_WRITE, GARAGE_ID

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function randId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL || '';
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY_CI || '';
  const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

  const outDir = path.resolve(process.cwd(), '.tmp');
  await ensureDir(outDir);
  const outFile = path.join(outDir, 'test-env.json');

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    // create empty file to signal skip
    fs.writeFileSync(outFile, JSON.stringify({ seeded: false }, null, 2));
    return { seeded: false };
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Minimal deterministic seed
  // 1) Public vehicle
  const pubVehicleId = randId('pubveh');
  await admin.from('vehicle').insert({ id: pubVehicleId, privacy: 'PUBLIC', make: 'Demo', model: 'Public', nickname: 'Public Demo' }).throwOnError();

  // 2) Private garage + writer vehicle (membership optional via OWNER_EMAIL)
  const garageId = randId('gar');
  await admin.from('garage').insert({ id: garageId, name: 'CI Demo Garage' }).throwOnError();

  // NOTE: We don't create users here (no emails in CI). Instead, tests using STORAGE_STATE will control auth.
  // The writer vehicle exists and will be writable by the signed-in user in storage state, or tests will skip.
  const writerVehicleId = randId('veh');
  await admin.from('vehicle').insert({ id: writerVehicleId, garage_id: garageId, privacy: 'PRIVATE', make: 'Demo', model: 'Writer', nickname: 'Writer Demo' }).throwOnError();

  // 3) Build plans (2; one is_default) for writer vehicle
  const planA = randId('planA');
  const planB = randId('planB');
  await admin.from('build_plans').insert([
    { id: planA, vehicle_id: writerVehicleId, name: 'Baseline', is_default: true },
    { id: planB, vehicle_id: writerVehicleId, name: 'Track Day', is_default: false },
  ]).throwOnError();

  // 4) Tasks for writer vehicle (associate to plans)
  const t1 = randId('task');
  const t2 = randId('task');
  const t3 = randId('task');
  await admin.from('work_item').insert([
    { id: t1, vehicle_id: writerVehicleId, title: 'Oil change', status: 'PLANNED', plan_id: planA },
    { id: t2, vehicle_id: writerVehicleId, title: 'Brake pads', status: 'PLANNED', plan_id: planB },
    { id: t3, vehicle_id: writerVehicleId, title: 'Wash', status: 'PLANNED', plan_id: planA },
  ]).throwOnError();

  // 5) Timeline events for public vehicle
  const now = Date.now();
  const older = new Date(now - 48 * 3600 * 1000).toISOString();
  const recent = new Date(now - 6 * 3600 * 1000).toISOString();
  await admin.from('event').insert([
    { vehicle_id: pubVehicleId, type: 'NOTE', title: 'Old note', created_at: older },
    { vehicle_id: pubVehicleId, type: 'NOTE', title: 'Recent note', created_at: recent },
  ]).throwOnError();

  // 6) Optional: add OWNER membership if OWNER_EMAIL provided (requires SQL fn resolve_user_id_by_email)
  if (OWNER_EMAIL) {
    try {
      const { data: uidData, error: uidErr } = await admin.rpc('resolve_user_id_by_email', { p_email: OWNER_EMAIL });
      if (!uidErr && uidData) {
        await admin.from('garage_member').insert({ garage_id: garageId, user_id: uidData, role: 'OWNER' }).throwOnError();
      }
    } catch (e) {
      // non-fatal in CI
    }
  }

  const payload = {
    seeded: true,
    PUBLIC_VEHICLE_ID: pubVehicleId,
    VEHICLE_ID_WRITE: writerVehicleId,
    GARAGE_ID: garageId,
    PLAN_FROM_ID: planA,
    PLAN_TO_ID: planB,
  };
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  return payload;
}

if (require.main === module) {
  main().catch((e) => { console.error('[seed] error', e); process.exit(0); });
}

module.exports = { main };
