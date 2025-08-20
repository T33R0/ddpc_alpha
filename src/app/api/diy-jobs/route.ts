import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type PostBody = { vehicleId?: string; title?: string; wishlist_item_ids?: string[] | null };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody;
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : undefined;
    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    const wishlistIds = Array.isArray(body.wishlist_item_ids) ? body.wishlist_item_ids.filter((v) => typeof v === "string") : [];
    if (!vehicleId || !title) return NextResponse.json({ message: "vehicleId and title are required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: job, error } = await supabase
      .from("diy_job" as unknown as string)
      .insert({ vehicle_id: vehicleId, title, status: "open" })
      .select("id")
      .single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    if (wishlistIds.length > 0) {
      const links = wishlistIds.map((wid) => ({ diy_job_id: (job as any).id, wishlist_item_id: wid }));
      const { error: linkErr } = await supabase.from("part_use" as unknown as string).insert(links);
      if (linkErr) return NextResponse.json({ message: linkErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, job: { id: (job as any).id } }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


