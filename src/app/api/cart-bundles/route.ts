import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type PostBody = { wishlistItemIds?: string[] };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody;
    const ids = Array.isArray(body.wishlistItemIds) ? body.wishlistItemIds.filter((v) => typeof v === "string") : [];
    if (ids.length === 0) return NextResponse.json({ message: "wishlistItemIds required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    type WishlistRow = { id: string; vendor_id: string | null };
    const { data: items, error: selErr } = await supabase
      .from("wishlist_item" as unknown as string)
      .select("id, vendor_id")
      .in("id", ids) as unknown as { data: WishlistRow[] | null; error: { message: string } | null };
    if (selErr) return NextResponse.json({ message: selErr.message }, { status: 400 });
    if (!items || items.length === 0) return NextResponse.json({ message: "No items found" }, { status: 404 });

    const byVendor = new Map<string | null, string[]>();
    for (const it of items) {
      const key = it.vendor_id ?? null;
      const list = byVendor.get(key) ?? [];
      list.push(it.id);
      byVendor.set(key, list);
    }

    const rows = Array.from(byVendor.entries()).map(([vendor_id, wishlist_item_ids]) => ({ vendor_id, wishlist_item_ids }));
    const { data: bundles, error: insErr } = await supabase
      .from("cart_bundle" as unknown as string)
      .insert(rows)
      .select("id, vendor_id, wishlist_item_ids");
    if (insErr) return NextResponse.json({ message: insErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, bundles: bundles ?? [] }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


