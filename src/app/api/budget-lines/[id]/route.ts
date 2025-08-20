import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type PatchBody = {
  title?: string;
  qty?: number | null;
  est_unit_price?: number | null;
  need_by?: string | null;
  status?: string;
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as PatchBody;

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Load the line to handle side-effects
    type ExistingLine = { id: string; wishlist_item_id: string | null; status: string; purchased_at: string | null };
    const { data: existing, error: selErr } = await supabase
      .from("budget_line" as unknown as string)
      .select("id, wishlist_item_id, status, purchased_at")
      .eq("id", id)
      .maybeSingle<ExistingLine>();
    if (selErr) return NextResponse.json({ message: selErr.message }, { status: 400 });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.qty === "number" || body.qty === null) updates.qty = body.qty;
    if (typeof body.est_unit_price === "number" || body.est_unit_price === null) updates.est_unit_price = body.est_unit_price;
    if (typeof body.need_by === "string" || body.need_by === null) updates.need_by = body.need_by;
    if (typeof body.status === "string") updates.status = body.status;
    if (Object.keys(updates).length === 0) return NextResponse.json({ message: "Nothing to update" }, { status: 400 });

    // Handle purchase transition
    const isPurchased = typeof body.status === "string" && body.status.toLowerCase() === "purchased";
    if (isPurchased) {
      updates.purchased_at = existing.purchased_at ?? new Date().toISOString();
    }

    const { error: updErr } = await supabase
      .from("budget_line" as unknown as string)
      .update(updates)
      .eq("id", id);
    if (updErr) return NextResponse.json({ message: updErr.message }, { status: 400 });

    if (isPurchased && existing.wishlist_item_id) {
      await supabase
        .from("wishlist_item" as unknown as string)
        .update({ status: "purchased" })
        .eq("id", existing.wishlist_item_id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


