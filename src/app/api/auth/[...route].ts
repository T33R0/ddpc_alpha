import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { serverLog } from "@/lib/serverLog";

// Simple Google OAuth start endpoint supporting next= return path
export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const next = searchParams.get("next") || "/vehicles";
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}${next}` } });
  if (error || !data?.url) return NextResponse.redirect(new URL("/", req.url));
  serverLog("auth_oauth_start");
  return NextResponse.redirect(data.url);
}


