import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { vehicle_id, title, status, tags, due } = await req.json();
    if (!vehicle_id || !title) return NextResponse.json({ error: "Missing vehicle_id or title" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("work_item")
      .insert({
        vehicle_id,
        title,
        status: status ?? "BACKLOG",
        tags: Array.isArray(tags) ? tags : null,
        due: due || null,
      })
      .select("id, title, status, tags, due")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    try {
      if (user && data) {
        await supabase.from("activity_log").insert({
          actor_id: user.id,
          entity_type: "work_item",
          entity_id: data.id,
          action: "create",
          diff: { after: { title: data.title, status: data.status } },
        });
      }
    } catch {}
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
