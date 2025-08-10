import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { serverLog } from "@/lib/serverLog";
import { validateMergePayload } from "@/lib/validators/events";

export async function POST(req: NextRequest): Promise<Response> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const v = validateMergePayload(body);
  if (!v.ok) {
    serverLog("merge_event_rejected", { reason: v.error, userId: user.id });
    return NextResponse.json({ error: v.error }, { status: 400 });
  }
  const { from_plan_id, to_plan_id, vehicle_id, title, notes } = v.data;

  // Ensure vehicle exists and authz: owner or (future) member
  const { data: veh, error: vehErr } = await supabase
    .from("vehicle")
    .select("id, owner_id, garage_id")
    .eq("id", vehicle_id)
    .maybeSingle();
  if (vehErr) {
    serverLog("merge_event_rejected", { reason: "vehicle_lookup_failed", userId: user.id, vehicleId: vehicle_id });
    return NextResponse.json({ error: "Lookup failed" }, { status: 400 });
  }
  if (!veh) {
    serverLog("merge_event_rejected", { reason: "vehicle_not_found", userId: user.id, vehicleId: vehicle_id });
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let authorized = veh.owner_id === user.id;
  if (!authorized && veh.garage_id) {
    const { data: mem } = await supabase
      .from("garage_member")
      .select("user_id, role")
      .eq("garage_id", veh.garage_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (mem && (mem.role === "OWNER" || mem.role === "MANAGER")) authorized = true;
  }
  if (!authorized) {
    serverLog("merge_event_rejected", { reason: "forbidden", userId: user.id, vehicleId: vehicle_id });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Plans must exist and belong to vehicle
  const { data: plans, error: planErr } = await supabase
    .from("build_plans")
    .select("id, vehicle_id")
    .in("id", [from_plan_id, to_plan_id]);
  if (planErr) return NextResponse.json({ error: "Lookup failed" }, { status: 400 });
  if (!plans || plans.length !== 2) {
    serverLog("merge_event_rejected", { reason: "plan_not_found", userId: user.id, vehicleId: vehicle_id, fromPlanId: from_plan_id, toPlanId: to_plan_id });
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (plans.some(p => p.vehicle_id !== vehicle_id)) {
    serverLog("merge_event_rejected", { reason: "plan_vehicle_mismatch", userId: user.id, vehicleId: vehicle_id, fromPlanId: from_plan_id, toPlanId: to_plan_id });
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Create a MERGE event (immutability preserved: insert-only)
  const eventNotes = title ? `${title}${notes ? ` — ${notes}` : ""}` : (notes || "Plans merged");
  const { data: created, error: insErr } = await supabase
    .from("event")
    .insert({ vehicle_id, type: "MERGE", notes: eventNotes })
    .select("id, type, notes, created_at, vehicle_id")
    .single();
  if (insErr) {
    serverLog("merge_event_rejected", { reason: insErr.message, userId: user.id, vehicleId: vehicle_id, fromPlanId: from_plan_id, toPlanId: to_plan_id });
    return NextResponse.json({ error: "Create failed" }, { status: 400 });
  }

  serverLog("merge_event_accepted", { userId: user.id, vehicleId: vehicle_id, fromPlanId: from_plan_id, toPlanId: to_plan_id });
  return NextResponse.json({ ok: true, event: created }, { status: 201 });
}
