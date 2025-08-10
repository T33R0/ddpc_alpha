import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { serverLog } from "@/lib/serverLog";
import { upsertUserSettings } from "@/lib/queries/userSettings";

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

    const updated = await upsertUserSettings(supabase, user.id, { theme: theme as "system"|"light"|"dark" });
    if (!updated) return NextResponse.json({ ok: false }, { status: 400 });
    serverLog("theme_update", { user_id: user.id, theme });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}


