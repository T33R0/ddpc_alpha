// src/lib/queries/getVehiclePartsCurrent.ts
import { getServerSupabase } from "@/lib/supabase";

export async function getVehiclePartsCurrent(vehicleId: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("vehicle_part_state")
    .select("slot_code, slot_label, valid_from, catalog_id, variant_id, parts_catalog:catalog_id(brand,name,oem), part_variants:variant_id(sku,finish,size)")
    .eq("vehicle_id", vehicleId)
    .is("valid_to", null)
    .order("slot_code");
  if (error) throw error;
  return data;
}
