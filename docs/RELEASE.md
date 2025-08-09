# Release SOP

## Pre-flight
- Ensure local seed works and app boots
- Smoke test passes:
  - Login shows "Signed in as…"
  - Open demo vehicle → Timeline quick-add event → optimistic card → reload persists
  - Vehicles list → edit a vehicle field → Enter saves (disabled while pending), Esc reverts
  - Public page `/v/[id]` loads with privacy badge; no costs/notes/docs/odometer present
  - SummaryChips show values; OG image route returns image

## Deploy
- Open PRs with squash-merge only
- Required checks: build, test:smoke
- After merge, verify Vercel preview → promote to production

## Rollback
- Promote previous successful deployment in Vercel
- Alternatively, revert commit on `master` (no DB/RLS changes in this sprint)

## Known limits
- Events immutable after 24h
- Public sanitization: only display name, Y/M/M/T, hero image, privacy, last 5 events {title, occurred_at, type}
- No costs, documents, or raw odometer are exposed on public


