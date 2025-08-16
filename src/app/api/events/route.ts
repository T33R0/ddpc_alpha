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
    const raw = await req.json().catch(() => ({}));
    const manualTypeKey = typeof (raw as Record<string, unknown>).type_key === 'string' ? String((raw as Record<string, unknown>).type_key) : undefined;
    // Map app types -> DB types
    const typeToDb: Record<string, string> = {
      SERVICE: "SERVICE",
      MOD: "INSTALL",
      NOTE: "INSPECT",
      DYNO: "TUNE",
    };
    const dbType = typeToDb[type] ?? "INSPECT";

    // AuthZ: user must own the garage or be a member (role model can vary across envs)
    const { data: veh, error: vehErr } = await supabase
      .from("vehicle")
      .select("id, garage_id")
      .eq("id", vehicle_id)
      .maybeSingle();
    if (vehErr) return NextResponse.json({ error: "vehicle_lookup_failed", detail: vehErr.message, code: 400 }, { status: 400 });
    if (!veh) return NextResponse.json({ error: "vehicle_not_found_or_rls", vehicleId: vehicle_id, userId: user.id, code: 404 }, { status: 404 });

    let authorized = false;
    // check garage owner
    const { data: garage } = await supabase
      .from("garage")
      .select("owner_id")
      .eq("id", veh.garage_id as string)
      .maybeSingle();
    if (garage?.owner_id === user.id) authorized = true;
    if (!authorized) {
      // check any membership (role values differ across schemas)
      const { data: mem } = await supabase
        .from("garage_member")
        .select("user_id, role")
        .eq("garage_id", veh.garage_id as string)
        .eq("user_id", user.id)
        .maybeSingle();
      if (mem) authorized = true;
    }
    if (!authorized) return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });

    // Prepare insert; map title -> notes for storage if schema lacks title; let DB set created_at = now()
    const insertPayload: {
      vehicle_id: string;
      type: string;
      notes: string;
      created_by?: string;
    } = {
      vehicle_id,
      type: dbType,
      notes: title + (notes ? ` — ${notes}` : ""),
    };
    // include created_by when available to align with schemas that record authorship
    try { insertPayload.created_by = user.id; } catch { /* noop */ }

    const { data: created, error: insErr } = await supabase
      .from("event")
      .insert(insertPayload)
      .select("id, type, created_at, vehicle_id")
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message, code: 400 }, { status: 400 });

    // Update vehicle.last_event_at
    await supabase.from("vehicle").update({ last_event_at: created.created_at }).eq("id", vehicle_id);

    serverLog("event_create", { userId: user.id, vehicleId: vehicle_id, type: dbType, requestId });
    // Map DB type -> app type in response
    const dbToApp: Record<string, string> = { SERVICE: "SERVICE", INSTALL: "MOD", INSPECT: "NOTE", TUNE: "DYNO" };
    const appType = dbToApp[created.type] ?? "NOTE";
    const event = { id: created.id, vehicle_id: created.vehicle_id, type: appType, title, occurred_at: created.created_at, manualTypeKey } as const;
    return NextResponse.json({ event }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
