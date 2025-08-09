import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify vehicle exists and get its garage
    const { data: vehicle } = await supabase
      .from("vehicle")
      .select("id, garage_id")
      .eq("id", id)
      .maybeSingle();
    if (!vehicle) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Owner-only: check garage owner matches user
    const { data: garage } = await supabase
      .from("garage")
      .select("id, owner_id")
      .eq("id", vehicle.garage_id)
      .maybeSingle();
    if (!garage || garage.owner_id !== user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Last 12 months of events
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const sinceISO = twelveMonthsAgo.toISOString();

    const { data: events, error } = await supabase
      .from("event")
      .select("created_at, notes, type, odometer, cost")
      .eq("vehicle_id", id)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true });
    if (error) throw error;

    // CSV header
    const rows: string[] = [];
    rows.push(["occurred_at", "title", "type", "odometer", "cost"].join(","));
    for (const ev of events ?? []) {
      const occurred_at = new Date(ev.created_at as string).toISOString();
      const title = (ev.notes ?? "").toString().replaceAll('"', '""');
      const type = (ev.type ?? "").toString();
      const odometer = ev.odometer ?? "";
      const cost = ev.cost ?? "";
      rows.push([
        occurred_at,
        `"${title}"`,
        type,
        String(odometer),
        String(cost),
      ].join(","));
    }

    const body = rows.join("\n");
    const filename = `events_${id}_last12m.csv`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new NextResponse(msg, { status: 500 });
  }
}


