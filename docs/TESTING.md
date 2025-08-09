# Testing (Playwright)

This project uses Playwright for end-to-end tests. We support both public/anonymous flows and authenticated flows.

## Tags and selection

- Public/anonymous tests are tagged: `@public`
- Authenticated tests are tagged: `@auth`

Run selected subsets via grep:

```bash
# All tests
pnpm test:e2e

# Only public tests
pnpm exec playwright test --grep @public

# Only auth tests
pnpm exec playwright test --grep @auth
```

## Environment variables

Set these to enable more coverage:

- PUBLIC_VEHICLE_ID: a vehicle ID that is viewable publicly (used by `tests/smoke.spec.ts`).
- VEHICLE_ID_WRITE: a vehicle ID the signed-in user can write to (used by `tests/templates.spec.ts`).
- GARAGE_ID: a garage ID the signed-in user can manage (used by `tests/members.spec.ts`).
- STORAGE_STATE: path to a Playwright storage state JSON for a writer/owner (e.g., `.auth/owner.json`).
- VIEWER_STORAGE_STATE: path to a Playwright storage state JSON for a viewer (e.g., `.auth/viewer.json`).
- Optional ICS_EXPECT_EVENTS_PUBLIC, ICS_EXPECT_EVENTS_ME: expected minimum counts for ICS checks.

## Bootstrapping auth storage states

We include a bootstrap spec to generate storage states when a dev/mock login is available.

```bash
# Provide login URLs that perform a dev/mock login and set auth cookies, then redirect
export OWNER_LOGIN_URL="/api/test/login?role=OWNER"
export MANAGER_LOGIN_URL="/api/test/login?role=MANAGER"
export VIEWER_LOGIN_URL="/api/test/login?role=VIEWER"

# Start the app locally
pnpm build && pnpm start &

# Generate .auth/owner.json, .auth/manager.json, .auth/viewer.json
pnpm test:auth:bootstrap
```

These files can be referenced by tests via STORAGE_STATE and VIEWER_STORAGE_STATE envs.

If you do not have dev login endpoints, you can still test public flows with `@public` or manually create storage state files by signing in once in a headed browser and exporting `storageState()`.

## Minimal fixtures for CI/local

For broader coverage, seed a demo garage, a public vehicle, and assign roles:

- See `supabase/seed.sql` as a starting point for local development.
- Ensure there is at least one public vehicle whose ID you can set as `PUBLIC_VEHICLE_ID`.
- Ensure the signed-in writer has write access to a vehicle (`VEHICLE_ID_WRITE`) and to a garage (`GARAGE_ID`).

Tests are written to skip gracefully if required envs are not present (useful for forks with no secrets).

## CI

On pull requests, GitHub Actions will:

1) Build and start the app
2) Run E2E public tests (`@public`) always on PRs
3) If PR has label `run-auth-tests` or targets `main`, it will also attempt to run `@auth` tests
   - It will first run `pnpm test:auth:bootstrap` if login URLs are provided as secrets
   - It will export STORAGE_STATE/VIEWER_STORAGE_STATE if generated
   - If required envs are not present, `@auth` tests auto-skip
4) Upload artifacts on failures (Playwright traces)

Workflows:
  - `.github/workflows/smoke.yml` (fast: build + `test:smoke`)
  - `.github/workflows/e2e.yml` (full E2E, tags, Pa11y, Lighthouse)

Required checks for merge (documented): lint, typecheck, build, smoke, and e2e-public.
