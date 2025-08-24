import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const YEAR_CANDIDATES = ["year", "model_year", "Year"] as const;
const MAKE_CANDIDATES = ["make", "brand", "Make"] as const;
const MODEL_CANDIDATES = ["model", "Model"] as const;
const TRIM_CANDIDATES = ["trim", "Trim"] as const;

type DB = SupabaseClient;

function getDbClient(): DB | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    return createClient(url, serviceKey, { auth: { persistSession: false } });
  }
  return null;
}

async function selectDistinct(supabase: DB, col: string, filters?: Array<{ col: string; val: string }>, limit = 10000): Promise<string[]> {
  try {
    let q = supabase.from("vehicle_data").select(col, { head: false, count: "exact" }).not(col, "is", null);
    if (filters) {
      for (const f of filters) {
        q = q.eq(f.col, f.val);
      }
    }
    const { data } = await q.order(col, { ascending: true }).limit(limit);
    const rows = (data as unknown as Array<Record<string, string | number>> | null) ?? [];
    return Array.from(new Set(rows.map(v => String(v[col as keyof typeof v])))).filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "years"; // years | makes | models | trims
    const year = url.searchParams.get("year") || "";
    const make = url.searchParams.get("make") || "";
    const model = url.searchParams.get("model") || "";

    const admin = getDbClient();
    const supabase: DB = admin || await getServerSupabase();
    // Probe a row to infer available columns; fallback to candidate-first if probe empty
    const probe = await supabase.from("vehicle_data").select("*").limit(1);
    const row = Array.isArray(probe.data) && probe.data.length > 0 ? (probe.data[0] as Record<string, unknown>) : null;
    const pick = (cands: readonly string[]) => {
      if (row) {
        for (const c of cands) if (c in row) return c;
      }
      return cands[0];
    };
    const cols = {
      year: pick(YEAR_CANDIDATES),
      make: pick(MAKE_CANDIDATES),
      model: pick(MODEL_CANDIDATES),
      trim: pick(TRIM_CANDIDATES),
    } as const;

    if (scope === "years") {
      // Fetch many rows, then unique and sort descending so recent years appear first
      let values = await selectDistinct(supabase, cols.year, undefined, 20000);
      values = Array.from(new Set(values.map(String))).sort((a, b) => Number(b) - Number(a));
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "makes") {
      const values = await selectDistinct(supabase, cols.make, year ? [{ col: cols.year, val: year }] : undefined, 20000);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "models") {
      if (!year || !make) return NextResponse.json({ values: [] });
      const values = await selectDistinct(supabase, cols.model, [ { col: cols.year, val: year }, { col: cols.make, val: make } ], 20000);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "trims") {
      if (!year || !make || !model) return NextResponse.json({ values: [] });
      const values = await selectDistinct(supabase, cols.trim, [ { col: cols.year, val: year }, { col: cols.make, val: make }, { col: cols.model, val: model } ], 20000);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ values: [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, values: [] }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}


