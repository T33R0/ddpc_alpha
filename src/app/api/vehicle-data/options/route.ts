import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const YEAR_CANDIDATES = ["year", "model_year"] as const;
const MAKE_CANDIDATES = ["make", "brand"] as const;
const MODEL_CANDIDATES = ["model"] as const;
const TRIM_CANDIDATES = ["trim"] as const;

type DB = Awaited<ReturnType<typeof getServerSupabase>>;

function getDbClient(): DB | ReturnType<typeof createClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    return createClient(url, serviceKey, { auth: { persistSession: false } });
  }
  // Fallback to user-scoped client (RLS must allow public reads)
  // Note: This returns a Promise in our app lib, but we only call from async contexts
  // We'll wrap usages accordingly
  return null as unknown as DB;
}

async function selectDistinct(supabase: DB | ReturnType<typeof createClient>, col: string, filters?: Array<{ col: string; val: string }>): Promise<string[]> {
  try {
    let q = (supabase as any).from("vehicle_data").select(col, { head: false, count: "exact" }).not(col, "is", null);
    if (filters) {
      for (const f of filters) {
        q = q.eq(f.col, f.val);
      }
    }
    const { data } = await q.order(col, { ascending: true }).limit(500);
    const rows = (data as unknown as Array<Record<string, string | number>> | null) ?? [];
    return Array.from(new Set(rows.map(v => String(v[col as keyof typeof v])))).filter(Boolean);
  } catch {
    return [];
  }
}

async function tryCandidates(
  supabase: DB | ReturnType<typeof createClient>,
  colCandidates: readonly string[],
  filterCols: Array<{ key: string; candidates: readonly string[]; value: string }> = []
): Promise<{ col: string; values: string[] } | null> {
  for (const col of colCandidates) {
    // Expand filter combinations
    const filterCombos: Array<Array<{ col: string; val: string }>> = [[]];
    for (const f of filterCols) {
      const next: Array<Array<{ col: string; val: string }>> = [];
      for (const cand of f.candidates) {
        for (const combo of filterCombos) {
          next.push([...combo, { col: cand, val: f.value }]);
        }
      }
      filterCombos.splice(0, filterCombos.length, ...next);
    }
    // If no filters, still attempt once with empty
    if (filterCombos.length === 0) filterCombos.push([]);

    for (const filters of filterCombos) {
      const values = await selectDistinct(supabase, col, filters);
      if (values.length > 0) return { col, values };
    }
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "years"; // years | makes | models | trims
    const year = url.searchParams.get("year") || "";
    const make = url.searchParams.get("make") || "";
    const model = url.searchParams.get("model") || "";

    const admin = getDbClient();
    const supabase = admin || await getServerSupabase();
    // Probe a row to infer available columns; fallback to candidate-first if probe empty
    const probe = await (supabase as any).from("vehicle_data").select("*").limit(1);
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
      const values = await selectDistinct(supabase, cols.year);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "makes") {
      const values = await selectDistinct(supabase, cols.make, year ? [{ col: cols.year, val: year }] : undefined);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "models") {
      if (!year || !make) return NextResponse.json({ values: [] });
      const values = await selectDistinct(supabase, cols.model, [ { col: cols.year, val: year }, { col: cols.make, val: make } ]);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "trims") {
      if (!year || !make || !model) return NextResponse.json({ values: [] });
      const values = await selectDistinct(supabase, cols.trim, [ { col: cols.year, val: year }, { col: cols.make, val: make }, { col: cols.model, val: model } ]);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ values: [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, values: [] }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}


