import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
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
