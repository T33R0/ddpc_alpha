import { NextRequest, NextResponse } from 'next/server';

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? '';
  const secret = process.env.CRON_SECRET ?? '';
  if (!secret) return false;
  return header === secret || header === `Bearer ${secret}`;
}

async function handleCron(req: NextRequest): Promise<Response> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // Server-only log; no PII
  try {
    console.log(JSON.stringify({ evt: 'cron_digest_fired', dryRun: true, env: process.env.VERCEL_ENV || 'local' }));
  } catch {}
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

export function PUT() { return NextResponse.json({}, { status: 405 }); }
export function DELETE() { return NextResponse.json({}, { status: 405 }); }
