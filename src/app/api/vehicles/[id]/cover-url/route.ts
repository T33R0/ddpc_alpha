import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getVehicleCoverUrl } from "@/lib/getVehicleCoverUrl";

export async function GET(_req: Request, context: unknown) {
  const id = (context as { params?: { id?: string } })?.params?.id;
  if (!id) return NextResponse.json({ url: null }, { status: 200 });
  try {
    const supabase = await getServerSupabase();
    const { data: vehicle } = await supabase
      .from("vehicle")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();
    const url = await getVehicleCoverUrl(supabase, id, (vehicle as { photo_url?: string | null } | null)?.photo_url ?? null);
    return NextResponse.json({ url: url ?? null });
  } catch {
    return NextResponse.json({ url: null }, { status: 200 });
  }
}

// 


