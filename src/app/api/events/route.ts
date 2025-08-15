import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { serverLog } from "@/lib/serverLog";
import { validateCreateEventPayload } from "@/lib/validators/events";

export async function GET(): Promise<Response> {
  return NextResponse.json({ ok: true, route: "/api/events" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 10);
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: 401 }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const v = validateCreateEventPayload(body);
    if (!v.ok) return NextResponse.json({ error: v.error, code: 400 }, { status: 400 });
    const { vehicle_id, occurred_at, title, notes, type } = v.data;

    // AuthZ: OWNER or MANAGER of vehicle's garage
    const { data: veh } = await supabase
      .from("vehicle")
      .select("id, owner_id, garage_id")
      .eq("id", vehicle_id)
      .maybeSingle();
    if (!veh) return NextResponse.json({ error: "Not found", code: 404 }, { status: 404 });

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
    if (!authorized) return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });

    // Prepare insert; map title -> notes for storage if schema lacks title
    const created_at = occurred_at ? new Date(occurred_at).toISOString() : new Date().toISOString();
    const insertPayload: {
      vehicle_id: string;
      type: string;
      notes: string;
      created_at: string;
    } = {
      vehicle_id,
      type,
      notes: title + (notes ? ` — ${notes}` : ""),
      created_at,
    };

    const { data: created, error: insErr } = await supabase
      .from("event")
      .insert(insertPayload)
      .select("id, type, created_at, vehicle_id")
      .single();
    if (insErr) return NextResponse.json({ error: "Create failed", code: 400 }, { status: 400 });

    // Update vehicle.last_event_at
    await supabase.from("vehicle").update({ last_event_at: created.created_at }).eq("id", vehicle_id);

    serverLog("event_create", { userId: user.id, vehicleId: vehicle_id, type, requestId });
    const event = { id: created.id, vehicle_id: created.vehicle_id, type: created.type, title, occurred_at: created.created_at };
    return NextResponse.json({ event }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
