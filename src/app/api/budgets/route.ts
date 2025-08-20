import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type PostBody = { vehicleId?: string; name?: string; period?: string | null };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody;
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : undefined;
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const period = typeof body.period === "string" ? body.period : null;
    if (!vehicleId || !name) return NextResponse.json({ message: "vehicleId and name are required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("budget_plan" as unknown as string)
      .insert({ vehicle_id: vehicleId, name, period })
      .select("id")
      .single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, plan: { id: (data as any).id } }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


