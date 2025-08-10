import type { SupabaseClient } from "@supabase/supabase-js";

export type TaskItem = {
  id: string;
  vehicle_id: string;
  status: string;
  title: string;
  tag?: string | null;
};

export async function fetchTasks({ supabase, vehicleId, status, tag, limit = 20 }:
  { supabase: SupabaseClient; vehicleId?: string; status?: string; tag?: string; limit?: number; })
: Promise<{ items: TaskItem[] }> {
  type Row = { id: string; vehicle_id: string; status: string; title: string | null; tag: string | null };
  let q = supabase.from("work_item").select("id, vehicle_id, status, title, tag").order("created_at", { ascending: false }).limit(limit);
  if (vehicleId) q = q.eq("vehicle_id", vehicleId);
  if (status) q = q.eq("status", status);
  if (tag) q = q.eq("tag", tag);
  const { data, error } = await q as unknown as { data: Row[] | null; error: unknown };
  if (error || !Array.isArray(data)) return { items: [] };
  return { items: data.map((r: Row) => ({ id: r.id, vehicle_id: r.vehicle_id, status: r.status, title: r.title ?? "", tag: r.tag ?? null })) };
}
