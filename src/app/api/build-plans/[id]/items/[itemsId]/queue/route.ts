import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const supabase = createClient();
  const { dueOn, tags } = await req.json().catch(() => ({}));

  const { data: item, error: itemErr } = await supabase
    .from("build_plan_items")
    .select("id, title, slot_code, part_variant_id, build_plan_id, build_plans!inner(vehicle_id)")
    .eq("id", params.itemId)
    .single();
  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 400 });

  const insert = {
    vehicle_id: item.build_plans.vehicle_id,
    build_plan_id: item.build_plan_id,
    title: item.title,
    status: "open",
    due_on: dueOn ?? null,
    slot_code: item.slot_code ?? null,
    part_variant_id: item.part_variant_id ?? null,
    tags: Array.isArray(tags) ? tags : [],
  };

  const { data, error } = await supabase
    .from("work_items")
    .insert(insert)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}
