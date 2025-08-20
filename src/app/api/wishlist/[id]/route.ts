import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type PatchBody = {
  status?: string;
  est_unit_price?: number | null;
  notes?: string | null;
  priority?: number | null;
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as PatchBody;

    const updates: Record<string, unknown> = {};
    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.est_unit_price === "number" || body.est_unit_price === null) updates.est_unit_price = body.est_unit_price;
    if (typeof body.notes === "string" || body.notes === null) updates.notes = body.notes;
    if (typeof body.priority === "number" || body.priority === null) updates.priority = body.priority;
    if (Object.keys(updates).length === 0) return NextResponse.json({ message: "Nothing to update" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("wishlist_item" as unknown as string)
      .update({ ...updates })
      .eq("id", id);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


