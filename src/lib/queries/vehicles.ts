import type { SupabaseClient } from "@supabase/supabase-js";

export type VehicleOption = { id: string; name: string };

export async function fetchAccessibleVehicles(supabase: SupabaseClient): Promise<VehicleOption[]> {
  const { data, error } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error || !Array.isArray(data)) return [];
  return data.map((v: { id: string; year: number | null; make: string | null; model: string | null; nickname: string | null; }) => ({
    id: v.id,
    name: v.nickname?.trim() || [v.year, v.make, v.model].filter(Boolean).join(" ") || v.id,
  }));
}
