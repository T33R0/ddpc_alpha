import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { serverLog } from "@/lib/serverLog";

type Theme = "system" | "light" | "dark";

export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const body = (await req.json()) as { theme?: unknown };
    const theme = String(body?.theme || "system");
    if (theme !== "system" && theme !== "light" && theme !== "dark") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const meta = { ...(user.user_metadata as Record<string, unknown>), theme_pref: theme };
    const { error } = await supabase.auth.updateUser({ data: meta });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    serverLog("theme_updated", { user_id: user.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}


