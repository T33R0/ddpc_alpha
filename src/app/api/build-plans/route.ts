import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { serverLog } from "@/lib/serverLog";

export async function POST(req: NextRequest) {
  try {
    const { vehicle_id, name, description } = await req.json();
    if (!vehicle_id || !name) return NextResponse.json({ error: "Missing vehicle_id or name" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Owner-only check
    const { data: veh } = await supabase.from("vehicle").select("id, owner_id").eq("id", vehicle_id).maybeSingle();
    if (!veh || veh.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabase
      .from("build_plans")
      .insert({ vehicle_id, name, description: description || null, created_by: user.id, status: 'open' })
      .select("id, vehicle_id, name, description, status, is_default, created_at, updated_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    serverLog("build_plan_created", { planId: data.id, vehicleId: data.vehicle_id, userId: user.id });
    return NextResponse.json({ ok: true, plan: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
