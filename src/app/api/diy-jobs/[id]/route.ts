import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type PatchBody = { status?: string };

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as PatchBody;
    const status = typeof body.status === "string" ? body.status : undefined;
    if (!status) return NextResponse.json({ message: "status required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const updates: Record<string, unknown> = { status };
    if (status === "done") updates.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("diy_job" as unknown as string)
      .update(updates)
      .eq("id", id);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


