import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ vehicles: [] });

    const { data: memberships } = await supabase
      .from("garage_member")
      .select("garage_id")
      .eq("user_id", user.id);
    const garageIds = (memberships ?? []).map((m: { garage_id: string }) => m.garage_id);

    let query = supabase
      .from("vehicle")
      .select("id, year, make, model, nickname, privacy, updated_at, garage_id")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (garageIds.length > 0) {
      query = query.in("garage_id", garageIds as unknown as string[]);
    } else {
      // If no memberships, return only PUBLIC vehicles (fallback)
      query = query.eq("privacy", "PUBLIC");
    }
    const { data } = await query;
    const vehicles = (data ?? []).map((v: { id: string; year: number | null; make: string | null; model: string | null; nickname: string | null; privacy: string | null }) => ({
      id: v.id,
      name: v.nickname || [v.year, v.make, v.model].filter(Boolean).join(" "),
      privacy: v.privacy,
    }));
    return NextResponse.json({ vehicles });
  } catch {
    return NextResponse.json({ vehicles: [] });
  }
}


