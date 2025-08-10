import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest, context: unknown) {
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id", code: 400 }, { status: 400 });
  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "5", 10) || 5, 1), 25);
  try {
    const supabase = await getServerSupabase();
    // Ensure vehicle is public
    const { data: vehicle } = await supabase
      .from("vehicle")
      .select("id, privacy")
      .eq("id", id)
      .maybeSingle();
    if (!vehicle) return NextResponse.json({ error: "Not found", code: 404 }, { status: 404 });
    if ((vehicle.privacy as string) !== "PUBLIC") return NextResponse.json({ error: "Not found", code: 404 }, { status: 404 });

    const { data: events, error } = await supabase
      .from("event")
      .select("id, type, notes, created_at")
      .eq("vehicle_id", id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ error: "Query failed", code: 400 }, { status: 400 });

    return NextResponse.json({ items: (events || []).map(e => ({ id: e.id, type: e.type, occurred_at: e.created_at, title: undefined, notes: e.notes })) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
