import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type Body = {
  title?: string;
  asking_price?: number | null;
  currency?: string | null;
  location?: string | null;
  link_url?: string;
  source?: string | null;
  thumb_url?: string | null;
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as Body;
    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    const link_url = typeof body.link_url === "string" ? body.link_url : undefined;
    if (!title || !link_url) return NextResponse.json({ message: "title and link_url required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = {
      hunt_id: id,
      title,
      link_url,
      asking_price: typeof body.asking_price === "number" ? body.asking_price : null,
      currency: typeof body.currency === "string" ? body.currency : null,
      location: typeof body.location === "string" ? body.location : null,
      source: typeof body.source === "string" ? body.source : null,
      thumb_url: typeof body.thumb_url === "string" ? body.thumb_url : null,
    };

    const { data, error } = await supabase
      .from("market_vehicle" as unknown as string)
      .insert(payload)
      .select("id")
      .single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, listing: { id: (data as any).id } }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


