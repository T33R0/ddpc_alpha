import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await getServerSupabase();
  const { completedAt } = await req.json().catch(() => ({}));
  const patch = {
    status: "done",
    completed_at: completedAt ? new Date(completedAt).toISOString() : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("work_items")
    .update(patch)
    .eq("id", params.id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}
