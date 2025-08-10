import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getVehicleCoverUrl } from "@/lib/getVehicleCoverUrl";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getServerSupabase();
    const { data: vehicle } = await supabase
      .from("vehicle")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();
    const url = await getVehicleCoverUrl(supabase, id, (vehicle as { photo_url?: string | null } | null)?.photo_url ?? null);
    return NextResponse.json({ url: url ?? null });
  } catch {
    return NextResponse.json({ url: null });
  }
}


