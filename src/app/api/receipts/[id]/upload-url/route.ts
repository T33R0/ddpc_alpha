import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  try {
    // TODO: Integrate with Supabase Storage signed upload if desired
    const url = "https://example.com/upload";
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}
