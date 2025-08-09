# Operations

## Daily Cron: Digest

- Endpoint: `/api/cron/digest`
- Methods: `GET` (primary for Vercel Cron) and `POST` (manual/local)
- Auth: validate `Authorization` header against `process.env.CRON_SECRET`.
  - Accepts either the raw secret or `Bearer <secret>` format.
- Behavior: logs a structured message `cron_digest_fired` with `{ dryRun: true, env }` and returns `{ ok: true }`

### Configure in Vercel

- File `vercel.json` includes:

```json
{
  "crons": [
    { "path": "/api/cron/digest", "schedule": "0 13 * * *" }
  ]
}
```

- In the Vercel project settings, add an Environment Variable:
  - Name: `CRON_SECRET`
  - Value: a strong random token (Vercel will send this value in the `Authorization` header when invoking the cron)

Local testing can use the same value or any value you export.

### Rotate the secret

1. Create a new value in Vercel Project → Settings → Environment Variables (update `CRON_SECRET`).
2. Redeploy. Vercel Cron uses the injected header value; the route validates against `CRON_SECRET`.
3. Remove the old value in a follow-up change if needed.

### Local testing

- Missing/incorrect header → `401`.
- Correct header → `200 { ok: true }` and a server log line with `cron_digest_fired`.

```
curl -i "http://localhost:3000/api/cron/digest" \
  -H "Authorization: $CRON_SECRET"
```
