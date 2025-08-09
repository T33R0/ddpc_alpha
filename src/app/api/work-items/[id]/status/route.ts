import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity/log";
const ENABLE_LINK = process.env.ENABLE_TASK_EVENT_LINK === "true";

type RouteContext = { params: Promise<{ id: string }> };
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const status = body?.status;
    if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: before } = await supabase.from("work_item").select("id, status, vehicle_id, title, tags").eq("id", id).maybeSingle();
    const { error } = await supabase.from("work_item").update({ status }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (user && before) {
      await logActivity({
        actorId: user.id,
        entityType: "work_item",
        entityId: id,
        action: "update",
        diff: { before: { status: before.status }, after: { status } },
      });
    }

    // Optional: also log event when completing
    if (ENABLE_LINK && (body?.logEvent === true || body?.logEvent === "1") && status === "DONE") {
      try {
        const eventBody: Record<string, unknown> = {
          vehicle_id: (before as { vehicle_id: string }).vehicle_id,
          title: (before as { title?: string }).title ?? "Task completed",
          task_id: id,
        };
        if (body?.eventPayload?.date) eventBody.date = body.eventPayload.date;
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventBody),
        });
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
