import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { status } = await req.json();
    if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: before } = await supabase.from("work_item").select("id, status").eq("id", id).maybeSingle();
    const { error } = await supabase.from("work_item").update({ status }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    try {
      if (user && before) {
        await supabase.from("activity_log").insert({
          actor_id: user.id,
          entity_type: "work_item",
          entity_id: id,
          action: "update",
          diff: { before: { status: before.status }, after: { status } },
        });
      }
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
