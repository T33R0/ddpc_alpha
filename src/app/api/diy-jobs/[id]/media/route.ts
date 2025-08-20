import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getJobMediaUploadUrl } from "@/lib/storage";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: job, error } = await supabase
      .from("diy_job" as unknown as string)
      .select("id, vehicle_id")
      .eq("id", id)
      .maybeSingle();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    if (!job) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const signed = await getJobMediaUploadUrl((job as any).vehicle_id, (job as any).id);
    return NextResponse.json({ ok: true, uploadUrl: { url: signed.url, path: signed.path } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}


