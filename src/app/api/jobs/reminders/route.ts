import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10);
  const seven = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    let owners: Record<string, number> = {};
    if (url && serviceKey) {
      const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
      // Aggregate due work items per owner in next 7 days
      const { data, error } = await admin
        .from("work_item")
        .select(
          `id, due, vehicle:vehicle_id(id, garage:garage_id(owner_id))`
        )
        .not("due", "is", null)
        .gte("due", today)
        .lte("due", seven);
      if (error) throw error;
      const rows: unknown[] = Array.isArray(data) ? data : [];
      for (const r of rows) {
        if (!r || typeof r !== "object") continue;
        const row = r as { vehicle?: { garage?: { owner_id?: string | null } | null } | null };
        const owner = row.vehicle?.garage?.owner_id ?? null;
        if (!owner) continue;
        owners[owner] = (owners[owner] ?? 0) + 1;
      }
    } else {
      // Fallback: attempt user-scoped query (likely returns 0 due to RLS)
      const supabase = await getServerSupabase();
      await supabase
        .from("work_item")
        .select("id")
        .not("due", "is", null)
        .gte("due", today)
        .lte("due", seven)
        .limit(1);
      owners = {}; // unknown owners without service role
    }

    // Minimal structured log
    console.log(JSON.stringify({ level: "info", q: "reminders_cron", owners, at: now.toISOString() }));
    return new Response("OK", { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[reminders_cron] error", msg);
    return new Response("ERR", { status: 500 });
  }
}
