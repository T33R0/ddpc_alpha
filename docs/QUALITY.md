# Quality Checks (Perf & A11y)

## Pa11y

We run `pa11y-ci` against a small set of URLs:
- `/`
- `/vehicles`
- `/v/[public vehicle id]` (if `PUBLIC_VEHICLE_ID` is available)
- `/garage/[id]/members` (if `GARAGE_ID` is available)

- Fails on serious issues only; warnings for lesser issues.
- CI uploads the JSON report as an artifact.

Local run:
```
pnpm run qa:pa11y
```

## Lighthouse CI

We run `lhci autorun` against the local app for:
- `/`
- `/vehicles`

Assertions (warn-only for now):
- Performance ≥ 70
- Accessibility ≥ 90
- Best Practices ≥ 85
- SEO ≥ 80

Local run:
```
pnpm run qa:lhci:autorun
```

Artifacts are uploaded in CI and summary printed to logs.
