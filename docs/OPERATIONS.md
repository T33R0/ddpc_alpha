# Operations

## Daily Cron: Digest

- Endpoint: `POST /api/cron/digest`
- Auth: requires `x-cron-secret` header equal to `process.env.CRON_SECRET`
- Rate limit: ~1 request/min per IP (in-memory; sufficient for Vercel Cron)
- Behavior: logs a structured message `cron_digest_fired` with `{ dryRun: true, env }` and returns `{ ok: true }`

### Configure in Vercel

- File `vercel.json` includes:

```json
{
  "crons": [
    { "path": "/api/cron/digest", "schedule": "0 13 * * *", "method": "POST", "headers": { "x-cron-secret": "@cron_secret" } }
  ]
}
```

- In the Vercel project settings, add an Environment Variable:
  - Name: `cron_secret`
  - Value: a strong random token (use Vercel-generated secret or add manually)

- Add an Environment Variable `CRON_SECRET` with the same value if you want to test locally (or pass header explicitly when calling locally).

### Rotate the secret

1. Create a new value in Vercel Project → Settings → Environment Variables (update both `cron_secret` and `CRON_SECRET`).
2. Redeploy. Vercel Cron uses the injected header value; the route validates against `CRON_SECRET`.
3. Remove the old value in a follow-up change if needed.

### Local testing

- Missing/incorrect header → `401`.
- Correct header → `200 { ok: true }` and a server log line with `cron_digest_fired`.

```
curl -i -X POST http://localhost:3000/api/cron/digest -H "x-cron-secret: $CRON_SECRET"
```
