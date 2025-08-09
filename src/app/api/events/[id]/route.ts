import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function DELETE(_req: Request, context: { params: { id: string } }) {
  const id = context?.params?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from("event").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
