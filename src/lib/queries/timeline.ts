import type { SupabaseClient } from "@supabase/supabase-js";

export type TimelineItem = {
  id: string;
  vehicle_id: string;
  occurred_at: string;
  type: string;
  title: string;
};

export async function fetchTimeline({ supabase, vehicleId, dateFrom, dateTo, tag, limit = 20 }:
  { supabase: SupabaseClient; vehicleId?: string; dateFrom?: string; dateTo?: string; tag?: string; limit?: number; })
: Promise<{ items: TimelineItem[] }> {
  type Row = { id: string; vehicle_id: string; occurred_at: string; type: string; notes: string | null };
  let q = supabase
    .from("event")
    .select("id, vehicle_id, occurred_at:created_at, type, notes")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (vehicleId) q = q.eq("vehicle_id", vehicleId);
  // TODO: dateFrom/dateTo/tag can be wired to schema when available; avoid unused warnings for now
  void dateFrom; void dateTo; void tag;
  const { data, error } = await q as unknown as { data: Row[] | null; error: unknown };
  if (error || !Array.isArray(data)) return { items: [] };
  return { items: data.map((r: Row) => ({ id: r.id, vehicle_id: r.vehicle_id, occurred_at: r.occurred_at, type: r.type, title: r.notes ?? "" })) };
}
