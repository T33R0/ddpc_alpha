import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { tags } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (tags !== null && !Array.isArray(tags)) {
      return NextResponse.json({ error: "tags must be an array of strings or null" }, { status: 400 });
    }

    const normalized = Array.isArray(tags)
      ? tags.map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean)
      : null;

    const supabase = await getServerSupabase();
    const { error } = await supabase.from("work_item").update({ tags: normalized }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
