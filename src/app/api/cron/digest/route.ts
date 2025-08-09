import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limit (per IP) ~1 req/min
const lastHitByIp = new Map<string, number>();

export async function POST(req: NextRequest): Promise<Response> {
  const secretHeader = req.headers.get('x-cron-secret') || '';
  const expected = process.env.CRON_SECRET || '';
  if (!expected || secretHeader !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const now = Date.now();
  const last = lastHitByIp.get(ip) || 0;
  if (now - last < 60_000) {
    return NextResponse.json({ ok: true, throttled: true }, { status: 200 });
  }
  lastHitByIp.set(ip, now);

  // Server-only log; no PII
  try {
    console.log(JSON.stringify({ level: 'info', q: 'cron_digest_fired', env: process.env.VERCEL_ENV || 'local', dryRun: true }));
  } catch {}

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
