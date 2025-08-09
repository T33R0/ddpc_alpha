import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity/log";
const ENABLE_LINK = process.env.ENABLE_TASK_EVENT_LINK === "true";

// POST /api/events
// Body: { vehicle_id: string, title: string, date?: string }
// For MVP we map title -> notes and date -> created_at; type defaults to 'SERVICE'.
export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await req.json().catch(() => ({}));
    const vehicle_id = (body?.vehicle_id ?? "").toString();
    const title = (body?.title ?? "").toString().trim();
    const dateStr = body?.date ? body.date.toString() : "";
    const task_id = ENABLE_LINK && body?.task_id ? body.task_id.toString() : undefined;

    if (!vehicle_id) {
      return NextResponse.json({ error: "vehicle_id is required" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    let created_at: string | undefined = undefined;
    if (dateStr) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      created_at = d.toISOString();
    }

    const payload: Record<string, unknown> = {
      vehicle_id,
      type: "SERVICE",
      notes: title,
    };
    if (created_at) payload.created_at = created_at;
    if (ENABLE_LINK && task_id) {
      // Validate task belongs to same garage context as vehicle (type-safe, single row selects)
      const { data: veh, error: vehErr } = await supabase
        .from("vehicle")
        .select("garage_id")
        .eq("id", vehicle_id)
        .single();

      const { data: task, error: taskErr } = await supabase
        .from("work_item")
        .select("id, vehicle:vehicle_id(garage_id)")
        .eq("id", task_id)
        .single();

      if (vehErr || taskErr) {
        return NextResponse.json({ error: "Lookup failed" }, { status: 400 });
      }

      // Narrow potential array typing at compile-time (defensive for tooling that doesn't reflect .single)
      if (!veh || Array.isArray(veh) || !task || Array.isArray(task)) {
        return NextResponse.json({ error: "Task and vehicle mismatch" }, { status: 400 });
      }
      const vehGarage = veh.garage_id;
      const taskGarage = task.vehicle?.garage_id;
      if (taskGarage !== vehGarage) {
        return NextResponse.json({ error: "Task and vehicle mismatch" }, { status: 400 });
      }

      payload.task_id = task_id;
    }

    const { data, error } = await supabase
      .from("event")
      .insert(payload)
      .select("id, type, odometer, cost, notes, created_at")
      .single();

    if (error) throw error;
    if (user) {
      await logActivity({
        actorId: user.id,
        entityType: "event",
        entityId: data.id,
        action: "create",
        diff: { after: { notes: data.notes, type: data.type, created_at: data.created_at }, ...(ENABLE_LINK && task_id ? { linked_task_id: task_id } : {}) },
      });
    }
    return NextResponse.json({ event: data, linkedTask: task_id ? { id: task_id } : null }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
