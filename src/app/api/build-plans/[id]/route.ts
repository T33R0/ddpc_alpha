import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { serverLog } from "@/lib/serverLog";

type RouteContext = { params: Promise<{ id: string }> };

type JobPart = {
  id: string;
  job_id: string;
  name: string;
  brand: string | null;
  part_number: string | null;
  affiliate_url: string | null;
  price: number | null;
  qty: number | null;
  created_at: string;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const sb = await getServerSupabase();

  // Plan
  const { data: plan, error: planErr } = await sb
    .from('build_plans')
    .select('id, vehicle_id, name, status, created_by, created_at, updated_at')
    .eq('id', id)
    .single();
  if (planErr || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  // Jobs
  const { data: jobs, error: jobsErr } = await sb
    .from('job')
    .select('id, title, description, status, created_at, updated_at')
    .eq('build_plan_id', id)
    .order('created_at', { ascending: true });
  if (jobsErr) return NextResponse.json({ error: jobsErr.message }, { status: 500 });

  // Parts for all jobs
  const jobIds = (jobs ?? []).map(j => j.id);
  const partsByJob: Record<string, JobPart[]> = {};
  if (jobIds.length) {
    const { data: parts, error: partsErr } = await sb
      .from('job_part')
      .select('id, job_id, name, brand, part_number, affiliate_url, price, qty, created_at')
      .in('job_id', jobIds);
    if (partsErr) return NextResponse.json({ error: partsErr.message }, { status: 500 });
    for (const p of parts ?? []) {
      (partsByJob[p.job_id] ||= []).push(p as JobPart);
    }
  }

  // Totals
  const { data: planTotal } = await sb
    .from('v_build_plan_costs')
    .select('cost_total')
    .eq('build_plan_id', id)
    .single();

  return NextResponse.json({
    plan: { ...plan, total_cost: planTotal?.cost_total ?? 0 },
    jobs: (jobs ?? []).map(j => ({
      ...j,
      parts: partsByJob[j.id] ?? [],
    })),
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const payload = await req.json();
    const { name, description, is_default, status } = payload ?? {};

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Load plan + vehicle ownership
    const { data: plan, error: planErr } = await supabase
      .from("build_plans").select("id, vehicle_id, name, status, is_default").eq("id", id).maybeSingle();
    if (planErr) return NextResponse.json({ error: planErr.message }, { status: 400 });
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: veh } = await supabase.from("vehicle").select("id, owner_id").eq("id", plan.vehicle_id).maybeSingle();
    if (!veh || veh.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Validate status transitions using new model: open|closed|archived
    const nextStatus: string | undefined = status;
    if (typeof nextStatus !== "undefined") {
      if (["open","closed","archived"].indexOf(nextStatus) === -1) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    // If setting default, unset others for this vehicle
    if (is_default === true) {
      await supabase.from("build_plans").update({ is_default: false }).eq("vehicle_id", plan.vehicle_id).neq("id", id);
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof name !== "undefined") update.name = name;
    if (typeof description !== "undefined") update.description = description ?? null;
    if (typeof is_default !== "undefined") update.is_default = !!is_default;
    if (typeof nextStatus !== "undefined") update.status = nextStatus;

    const { data: updated, error: updErr } = await supabase
      .from("build_plans").update(update).eq("id", id)
      .select("id, vehicle_id, name, description, status, is_default, updated_at").single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    serverLog("build_plan_updated", { planId: updated.id, vehicleId: updated.vehicle_id, userId: user.id });
    return NextResponse.json({ ok: true, plan: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
