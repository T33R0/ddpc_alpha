import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // your helper

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json().catch(() => ({}));
  const { vehicleId, slotCode, slotLabel, partVariantId, occurredOn, note } = body;

  if (!vehicleId || !slotCode) {
    return NextResponse.json({ error: "vehicleId and slotCode required" }, { status: 400 });
  }

  // Optional: look up variant -> catalog
  let catalogId: string | null = null;
  if (partVariantId) {
    const { data: v, error: ve } = await supabase
      .from("part_variants")
      .select("catalog_id")
      .eq("id", partVariantId)
      .single();
    if (ve) return NextResponse.json({ error: ve.message }, { status: 400 });
    catalogId = v?.catalog_id ?? null;
  }

  // Close current row for the slot
  const { error: closeErr } = await supabase
    .from("vehicle_part_state")
    .update({ valid_to: new Date().toISOString() })
    .is("valid_to", null)
    .eq("vehicle_id", vehicleId)
    .eq("slot_code", slotCode);
  if (closeErr && closeErr.code !== "PGRST116") {
    // ignore "0 rows" error code, if your PostgREST differs just ignore missing
  }

  // Insert new state (source = manual)
  const insert = {
    vehicle_id: vehicleId,
    slot_code: slotCode,
    slot_label: slotLabel ?? slotCode.replaceAll("_", " ").replace(/\b\w/g, s => s.toUpperCase()),
    catalog_id: catalogId,
    variant_id: partVariantId ?? null,
    source: "manual",
    valid_from: occurredOn ? new Date(occurredOn).toISOString() : null,
    note: note ?? null,
  };

  const { data, error } = await supabase
    .from("vehicle_part_state")
    .insert(insert)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, partStateId: data.id });
}
