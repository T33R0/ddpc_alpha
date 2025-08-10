import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { validateUpdateWorkItemPlanPayload } from "@/lib/validators/workItems";
import { serverLog } from "@/lib/serverLog";

export async function PATCH(req: NextRequest, context: unknown) {
  const requestId = Math.random().toString(36).slice(2, 10);
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id", code: 400 }, { status: 400 });
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: 401 }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const v = validateUpdateWorkItemPlanPayload(body);
    if (!v.ok) return NextResponse.json({ error: v.error, code: 400 }, { status: 400 });

    // Load work item and owning vehicle
    const { data: task } = await supabase
      .from("work_item")
      .select("id, vehicle_id")
      .eq("id", id)
      .maybeSingle();
    if (!task) return NextResponse.json({ error: "Not found", code: 404 }, { status: 404 });

    const { data: taskVeh } = await supabase
      .from("vehicle")
      .select("id, owner_id, garage_id")
      .eq("id", task.vehicle_id)
      .maybeSingle();
    if (!taskVeh) return NextResponse.json({ error: "Not found", code: 404 }, { status: 404 });

    // AuthZ: owner or manager of the garage
    let authorized = taskVeh.owner_id === user.id;
    if (!authorized && taskVeh.garage_id) {
      const { data: mem } = await supabase
        .from("garage_member")
        .select("user_id, role")
        .eq("garage_id", taskVeh.garage_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (mem && (mem.role === "OWNER" || mem.role === "MANAGER")) authorized = true;
    }
    if (!authorized) return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });

    // Validate plan belongs to same vehicle
    const { data: plan } = await supabase
      .from("build_plan")
      .select("id, vehicle_id")
      .eq("id", v.data.plan_id)
      .maybeSingle();
    if (!plan) return NextResponse.json({ error: "Invalid plan_id", code: 400 }, { status: 400 });
    if (plan.vehicle_id !== task.vehicle_id) {
      return NextResponse.json({ error: "Plan does not belong to the same vehicle", code: 400 }, { status: 400 });
    }

    const { error: updErr } = await supabase
      .from("work_item")
      .update({ plan_id: v.data.plan_id })
      .eq("id", id);
    if (updErr) return NextResponse.json({ error: "Update failed", code: 400 }, { status: 400 });

    serverLog("task_plan_updated", { userId: user.id, taskId: id, planId: v.data.plan_id, requestId });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
