import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

// POST /api/events
// Body: { vehicle_id: string, title: string, date?: string }
// For MVP we map title -> notes and date -> created_at; type defaults to 'SERVICE'.
export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const body = await req.json().catch(() => ({}));
    const vehicle_id = (body?.vehicle_id ?? "").toString();
    const title = (body?.title ?? "").toString().trim();
    const dateStr = body?.date ? body.date.toString() : "";

    if (!vehicle_id) {
      return NextResponse.json({ error: "vehicle_id is required" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    let created_at: string | undefined = undefined;
    if (dateStr) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      created_at = d.toISOString();
    }

    const payload: Record<string, unknown> = {
      vehicle_id,
      type: "SERVICE",
      notes: title,
    };
    if (created_at) payload.created_at = created_at;

    const { data, error } = await supabase
      .from("event")
      .insert(payload)
      .select("id, type, odometer, cost, notes, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ event: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
