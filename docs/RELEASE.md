# Release Notes

## Invites and Members (2025-08-09)

- Garage invites: Owners/Managers can create and revoke time-boxed invite links with selected roles.
- Invite acceptance: Validates token and joins/updates membership; redirects to `/vehicles?garage=<id>&joined=1`.
- Members add by email: Uses `resolve_user_id_by_email` RPC; friendly errors for non-existent users and existing members.
- Managers can remove members; Owners are protected from role change/remove.
- Viewers: write controls disabled, CSV/ICS export available when permitted.

### SQL Summary

- `garage_invite` table with RLS for OWNER/MANAGER on the same `garage_id`.
- `validate_garage_invite(text)` and `accept_garage_invite(text)` (security definer) for invite flow.
- `resolve_user_id_by_email(text)` with `authenticated` execute.

### Rollback

To roll back invite features:

```
drop function if exists accept_garage_invite(text);
drop function if exists validate_garage_invite(text);
drop table if exists garage_invite;
drop function if exists resolve_user_id_by_email(text);
```

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


