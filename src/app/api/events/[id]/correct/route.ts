import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await getServerSupabase();
  const body = await req.json().catch(() => ({}));
  const { occurredOn, dateConfidence, approxYear, approxMonth } = body;

  // Fetch created_at to compute immutability
  const { data: ev, error: getErr } = await supabase
    .from("events")
    .select("id, created_at")
    .eq("id", params.id)
    .single();

  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 400 });

  const createdAt = new Date(ev.created_at).getTime();
  const now = Date.now();
  const canEdit = now - createdAt <= 24 * 60 * 60 * 1000;

  if (!canEdit) {
    return NextResponse.json(
      { error: "immutable", message: "Create a correction event instead" },
      { status: 409 }
    );
  }

  const patch: Partial<{ occurred_on: string | null; date_confidence: 'unknown' | 'approximate' | 'exact' | null; approx_year: number | null; approx_month: number | null; }> = {};
  if (occurredOn !== undefined) patch.occurred_on = occurredOn ? new Date(occurredOn).toISOString().slice(0,10) : null;
  if (dateConfidence !== undefined) patch.date_confidence = dateConfidence; // must be 'unknown' | 'approximate' | 'exact'
  if (approxYear !== undefined) patch.approx_year = approxYear;
  if (approxMonth !== undefined) patch.approx_month = approxMonth;

  const { error: updErr } = await supabase.from("events").update(patch).eq("id", params.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
