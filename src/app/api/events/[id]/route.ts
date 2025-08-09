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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
