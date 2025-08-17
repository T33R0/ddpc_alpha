import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    const { data, error, count } = await supabase.from("vehicle_data").select("*", { count: "exact", head: false }).limit(1);
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
    const columns = row ? Object.keys(row as Record<string, unknown>) : [];
    return NextResponse.json({
      ok: true,
      count: typeof count === "number" ? count : (Array.isArray(data) ? data.length : 0),
      columns,
      sample: row,
      error: error?.message || null,
      meta: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
        projectRef: (() => { try { const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || ""); return u.hostname.split(".")[0]; } catch { return null; } })(),
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}


