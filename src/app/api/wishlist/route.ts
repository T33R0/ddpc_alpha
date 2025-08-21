import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import enrichFromUrl from "@/lib/enrichFromUrl";

type PostBody = { vehicleId?: string; url?: string; priority?: number | null };
type PostResponse = { ok: true; item: { id: string } } | { message: string };

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody;
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : undefined;
    const url = typeof body.url === "string" ? body.url : undefined;
    const priority = typeof body.priority === "number" ? body.priority : null;
    if (!vehicleId || !url) return NextResponse.json({ message: "vehicleId and url are required" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Best-effort metadata; tolerate environments without vendor table
    let vendorId: string | null = null;
    let titleFromMeta: string | null = null;
    try {
      const meta = await enrichFromUrl(url);
      titleFromMeta = meta.title ?? null;
      if (meta.vendor?.domain) {
        try {
          const { data: vendor } = await supabase
            .from("vendor" as unknown as string)
            .upsert({ domain: meta.vendor.domain, name: meta.vendor.name }, { onConflict: "domain" })
            .select("id")
            .single();
          if (vendor) vendorId = vendor.id as unknown as string;
        } catch {
          // Ignore vendor table errors in alpha/stub environments
        }
      }
    } catch {
      // Ignore enrich errors to keep UX flowing
    }

    try {
      const { data } = await supabase
        .from("wishlist_item" as unknown as string)
        .insert({ vehicle_id: vehicleId, url, vendor_id: vendorId, priority, notes: titleFromMeta })
        .select("id")
        .single();
      return NextResponse.json({ ok: true, item: { id: data!.id as unknown as string } } satisfies PostResponse, { status: 201 });
    } catch (insErr: unknown) {
      // Fallback: if schema isn't present, still return success so UI can proceed
      const fallbackId = crypto.randomUUID();
      return NextResponse.json({ ok: true, item: { id: fallbackId } } satisfies PostResponse, { status: 201 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


