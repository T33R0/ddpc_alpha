import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity/log";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title.trim() : undefined;
    const description = typeof body?.description === "string" ? body.description : undefined;
    const status = typeof body?.status === "string" ? body.status : undefined;

    if (title === undefined && description === undefined && status === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Load job with plan + vehicle to enforce RLS-like guardrails and ownership
    const { data: job } = await supabase
      .from("job")
      .select("id, title, description, status, build_plan_id")
      .eq("id", id)
      .maybeSingle();
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: plan } = await supabase
      .from("build_plans")
      .select("id, vehicle_id, status")
      .eq("id", job.build_plan_id as string)
      .maybeSingle();
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const { data: veh } = await supabase
      .from("vehicle")
      .select("id, owner_id")
      .eq("id", plan.vehicle_id as string)
      .maybeSingle();
    if (!veh || veh.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Guardrail: only update jobs on open plans
    if (plan.status !== "open") {
      return NextResponse.json({ error: "Plan is not open. You can only modify jobs on an open plan." }, { status: 400 });
    }

    // Validate status if provided
    if (status !== undefined) {
      const allowed = ["planning", "purchased", "active", "complete", "canceled"];
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: "Invalid job status" }, { status: 400 });
      }
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (status !== undefined) update.status = status;

    const { error: updErr } = await supabase.from("job").update(update).eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    if (user) {
      await logActivity({
        actorId: user.id,
        entityType: "work_item",
        entityId: id,
        action: "update",
        diff: { changed_fields: Object.keys(update) },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


