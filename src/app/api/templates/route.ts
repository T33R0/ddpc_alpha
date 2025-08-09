import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

const ENABLE_SERVER = process.env.ENABLE_DB_TEMPLATES === "true";

export async function GET(_req: NextRequest): Promise<Response> {
  if (!ENABLE_SERVER) return NextResponse.json({ templates: [] });
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ templates: [] });
  // GLOBAL + GARAGE templates visible per RLS
  const { data, error } = await supabase
    .from("task_templates" as unknown as string)
    .select("id, scope, garage_id, title, default_tags, default_due_interval_days, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ templates: data ?? [] });
}


