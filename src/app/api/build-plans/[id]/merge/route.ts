import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { serverLog } from "@/lib/serverLog";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Load plan
    const { data: plan, error: planErr } = await supabase
      .from("build_plans").select("id, vehicle_id, status, is_default").eq("id", id).maybeSingle();
    if (planErr) return NextResponse.json({ error: planErr.message }, { status: 400 });
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Owner-only
    const { data: veh } = await supabase.from("vehicle").select("id, owner_id").eq("id", plan.vehicle_id).maybeSingle();
    if (!veh || veh.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (plan.status === "merged") {
      return NextResponse.json({ error: "Plan already merged" }, { status: 400 });
    }

    // Fetch tasks assigned to this plan
    const { data: tasks, error: tasksErr } = await supabase
      .from("work_item").select("id").eq("build_plan_id", id);
    if (tasksErr) return NextResponse.json({ error: tasksErr.message }, { status: 400 });
    const mergedTaskIds = (tasks ?? []).map(t => t.id);

    // Create a merge event on vehicle timeline; encode payload in notes
    const notes = JSON.stringify({ planId: id, mergedTaskIds });
    const { data: event, error: evtErr } = await supabase
      .from("event")
      .insert({ vehicle_id: plan.vehicle_id, type: "MERGE_PLAN", notes })
      .select("id, created_at")
      .single();
    if (evtErr) return NextResponse.json({ error: evtErr.message }, { status: 400 });

    // Mark all tasks done (MVP) and clear default flag; set plan status merged
    if (mergedTaskIds.length) {
      await supabase.from("work_item").update({ status: "DONE" }).in("id", mergedTaskIds);
    }
    const { data: updated, error: updErr } = await supabase
      .from("build_plans").update({ status: "merged", is_default: false, updated_at: new Date().toISOString() }).eq("id", id)
      .select("id, status").single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    serverLog("build_plan_merged", { planId: id, vehicleId: plan.vehicle_id, userId: user.id, mergedTasks: mergedTaskIds.length });
    return NextResponse.json({ ok: true, eventId: event.id, mergedTaskCount: mergedTaskIds.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
