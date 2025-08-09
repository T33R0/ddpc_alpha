import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { due } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Accept null to clear due; accept string date
    const payload: { due: string | null } = { due: null };
    if (typeof due === "string" && due.trim().length > 0) {
      // Store as ISO date string (date-only ok if column is date/timestamp)
      payload.due = due;
    }

    const supabase = await getServerSupabase();
    const { error } = await supabase.from("work_item").update(payload).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
