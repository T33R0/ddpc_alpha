import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity/log";

export async function DELETE(_req: Request, context: unknown) {
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id", code: 400 }, { status: 400 });

  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: before } = await supabase
      .from("event")
      .select("id, type, notes, created_at, created_by")
      .eq("id", id)
      .maybeSingle();
    if (!before) return NextResponse.json({ error: "Not found", code: 404 }, { status: 404 });
    if (!user || before.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });
    }
    const { error } = await supabase.from("event").delete().eq("id", id);
    if (error) throw error;
    if (user && before) {
      await logActivity({
        actorId: user.id,
        entityType: "event",
        entityId: id,
        action: "delete",
        diff: { before: { type: before.type, notes: before.notes, created_at: before.created_at } },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }

}

export async function PATCH(req: NextRequest, context: unknown) {
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await req.json().catch(() => ({}));
    const notes = typeof body?.notes === "string" ? body.notes : undefined;
    const type = typeof body?.type === "string" ? body.type : undefined;

    if (notes === undefined && type === undefined) {
      return NextResponse.json({ error: "Nothing to update", code: 400 }, { status: 400 });
    }

    // Enforce 24h immutability window
    const { data: existing, error: fetchErr } = await supabase
      .from("event")
      .select("id, created_at, created_by")
      .eq("id", id)
      .maybeSingle();
    if (!user || !existing || (existing as { created_by?: string | null }).created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });
    }
    if (fetchErr) throw fetchErr;
    if (!existing) return NextResponse.json({ error: "Not found", code: 404 }, { status: 404 });
    const createdAt = new Date(existing.created_at as string);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    if (diffMs > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Event is immutable after 24h", code: 403 }, { status: 403 });
    }

    const dateStr = typeof (body as { date?: string })?.date === "string" ? (body as { date?: string }).date : undefined;
    const update: Record<string, unknown> = {};
    if (notes !== undefined) update.notes = notes;
    if (type !== undefined) {
      const allowed = ["SERVICE", "INSTALL", "INSPECT", "TUNE"];
      if (!allowed.includes(type)) {
        return NextResponse.json({ error: "Invalid type", code: 400 }, { status: 400 });
      }
      update.type = type;
    }
    if (dateStr !== undefined) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid date", code: 400 }, { status: 400 });
      }
      update.created_at = d.toISOString();
    }

    const { data, error } = await supabase
      .from("event")
      .update(update)
      .eq("id", id)
      .select("id, type, odometer, cost, notes, created_at")
      .single();
    if (error) throw error;
    if (user) {
      const changed: Record<string, unknown> = {};
      if (notes !== undefined) changed.notes = notes;
      if (type !== undefined) changed.type = data.type;
      if (dateStr !== undefined) changed.date = { date_from: existing.created_at, date_to: data.created_at };
      await logActivity({
        actorId: user.id,
        entityType: "event",
        entityId: id,
        action: "update",
        diff: { changed_fields: changed },
      });
    }
    return NextResponse.json({ event: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
