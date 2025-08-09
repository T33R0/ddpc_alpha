import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function DELETE(_req: Request, context: unknown) {
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from("event").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

}

export async function PATCH(req: NextRequest, context: unknown) {
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const supabase = await getServerSupabase();
    const body = await req.json().catch(() => ({}));
    const notes = typeof body?.notes === "string" ? body.notes : undefined;
    const type = typeof body?.type === "string" ? body.type : undefined;

    if (notes === undefined && type === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Enforce 24h immutability window
    const { data: existing, error: fetchErr } = await supabase
      .from("event")
      .select("id, created_at")
      .eq("id", id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const createdAt = new Date(existing.created_at as string);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    if (diffMs > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Event is immutable after 24h" }, { status: 403 });
    }

    const update: Record<string, unknown> = {};
    if (notes !== undefined) update.notes = notes;
    if (type !== undefined) {
      const allowed = ["SERVICE", "INSTALL", "INSPECT", "TUNE"];
      if (!allowed.includes(type)) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }
      update.type = type;
    }

    const { data, error } = await supabase
      .from("event")
      .update(update)
      .eq("id", id)
      .select("id, type, odometer, cost, notes, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ event: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
