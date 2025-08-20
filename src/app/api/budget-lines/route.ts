import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type PostBody = {
  budget_plan_id?: string;
  wishlist_item_id?: string | null;
  title?: string;
  qty?: number | null;
  est_unit_price?: number | null;
  need_by?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody;
    const planId = typeof body.budget_plan_id === "string" ? body.budget_plan_id : undefined;
    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    if (!planId || !title) return NextResponse.json({ message: "budget_plan_id and title are required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = {
      budget_plan_id: planId,
      wishlist_item_id: typeof body.wishlist_item_id === "string" ? body.wishlist_item_id : null,
      title,
      qty: typeof body.qty === "number" ? body.qty : null,
      est_unit_price: typeof body.est_unit_price === "number" ? body.est_unit_price : null,
      need_by: typeof body.need_by === "string" ? body.need_by : null,
    };

    const { data, error } = await supabase
      .from("budget_line" as unknown as string)
      .insert(payload)
      .select("id")
      .single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, line: { id: (data as any).id } }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


