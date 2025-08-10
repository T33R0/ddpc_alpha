// CI seed entrypoint. Calls the deterministic seed used by Playwright globalSetup.
// Env required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY_CI
// Optional: OWNER_EMAIL (adds OWNER membership to seeded garage if user exists)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const seed = require('../tests/utils/seed');

(async () => {
  try {
    const out = await seed.main();
    // eslint-disable-next-line no-console
    console.log('[seed-ci] done', out);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[seed-ci] error', e);
    process.exit(1);
  }
})();
