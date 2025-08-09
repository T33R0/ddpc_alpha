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

  // 2) Private garage + roles + writer vehicle
  const garageId = randId('gar');
  await admin.from('garage').insert({ id: garageId, name: 'CI Demo Garage' }).throwOnError();

  // NOTE: We don't create users here (no emails in CI). Instead, tests using STORAGE_STATE will control auth.
  // The writer vehicle exists and will be writable by the signed-in user in storage state, or tests will skip.
  const writerVehicleId = randId('veh');
  await admin.from('vehicle').insert({ id: writerVehicleId, garage_id: garageId, privacy: 'PRIVATE', make: 'Demo', model: 'Writer', nickname: 'Writer Demo' }).throwOnError();

  // 3) Timeline events for public vehicle
  const now = Date.now();
  const older = new Date(now - 48 * 3600 * 1000).toISOString();
  const recent = new Date(now - 6 * 3600 * 1000).toISOString();
  await admin.from('event').insert([
    { vehicle_id: pubVehicleId, type: 'NOTE', title: 'Old note', created_at: older },
    { vehicle_id: pubVehicleId, type: 'NOTE', title: 'Recent note', created_at: recent },
  ]).throwOnError();

  const payload = {
    seeded: true,
    PUBLIC_VEHICLE_ID: pubVehicleId,
    VEHICLE_ID_WRITE: writerVehicleId,
    GARAGE_ID: garageId,
  };
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  return payload;
}

if (require.main === module) {
  main().catch((e) => { console.error('[seed] error', e); process.exit(0); });
}

module.exports = { main };
