// Global setup for Playwright: run seed (if possible) and load .tmp/test-env.json
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  try {
    // Attempt seed (no-op if envs missing)
    const seed = require('./seed');
    if (seed && seed.main) {
      await seed.main();
    }
  } catch (e) {
    console.warn('[globalSetup] seed skipped or failed:', e?.message || e);
  }

  try {
    const p = path.resolve(process.cwd(), '.tmp', 'test-env.json');
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          if (v != null) process.env[k] = String(v);
        }
      }
    }
  } catch (e) {
    console.warn('[globalSetup] load env failed:', e?.message || e);
  }
};
