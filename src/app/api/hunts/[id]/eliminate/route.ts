import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type Body = { market_vehicle_id?: string; reason?: string };

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as Body;
    const marketVehicleId = typeof body.market_vehicle_id === "string" ? body.market_vehicle_id : undefined;
    const reason = typeof body.reason === "string" ? body.reason : undefined;
    if (!marketVehicleId || !reason) return NextResponse.json({ message: "market_vehicle_id and reason required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("market_vehicle" as unknown as string)
      .update({ eliminated_at: new Date().toISOString(), elimination_reason: reason })
      .eq("id", marketVehicleId)
      .eq("hunt_id", id);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


