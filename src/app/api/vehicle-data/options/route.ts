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

async function selectDistinct(
  supabase: DB,
  col: string,
  filters?: Array<{ col: string; val: string | number }>,
  pageSize = 10000,
  maxPages = 50
): Promise<string[]> {
  try {
    const seen = new Set<string>();
    let last: string | null = null;
    for (let page = 0; page < maxPages; page++) {
      let q = supabase
        .from("vehicle_data")
        .select(col, { head: false, count: "exact" })
        .not(col, "is", null)
        .order(col, { ascending: true });
      if (filters) {
        for (const f of filters) q = q.eq(f.col, f.val as unknown as string);
      }
      if (last !== null) {
        // advance the window strictly beyond the last value we saw
        q = q.gt(col, last as unknown as string);
      }
      const { data } = await q.limit(pageSize);
      const rows = (data as unknown as Array<Record<string, string | number>> | null) ?? [];
      if (rows.length === 0) break;
      for (const v of rows) {
        const val = String(v[col as keyof typeof v]);
        if (val) {
          seen.add(val);
          last = val; // update cursor to latest value in sorted order
        }
      }
      if (rows.length < pageSize) break; // reached the end
      if (seen.size > 50000) break; // guardrail
    }
    return Array.from(seen);
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

    // Build union helpers: some datasets can have multiple candidate columns populated inconsistently
    const allYears = YEAR_CANDIDATES;
    const buildYearFilters = (val: string | null | undefined): Array<{ col: string; val: string }> | undefined => {
      if (!val) return undefined;
      const filters: Array<{ col: string; val: string }> = [];
      for (const y of allYears) {
        filters.push({ col: y, val });
      }
      return filters;
    };

    if (scope === "years") {
      // Fetch many rows, then unique and sort descending so recent years appear first
      let values = await selectDistinct(supabase, cols.year, undefined, 20000);
      values = Array.from(new Set(values.map(String))).sort((a, b) => Number(b) - Number(a));
      // Safety net: if result is suspiciously small (e.g., duplicate-heavy table windowed to one year),
      // fill UX-required range 1990..2026 inclusive
      if (values.length <= 1) {
        values = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));
      }
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "makes") {
      // Try union across all year candidates to avoid truncation when data spans multiple columns
      const yearFilters = buildYearFilters(year);

      let agg: string[] = [];
      if (yearFilters && yearFilters.length > 0) {
        // Union: query each year column and combine results
        for (const yf of yearFilters) {
          const vals = await selectDistinct(supabase, cols.make, [yf], 20000);
          agg = agg.concat(vals);
          if (agg.length > 50000) break;
        }
      } else {
        agg = await selectDistinct(supabase, cols.make, undefined, 20000);
      }
      const values = Array.from(new Set(agg.map(String))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "models") {
      if (!year || !make) return NextResponse.json({ values: [] });
      const yearFilters = buildYearFilters(year) ?? [{ col: cols.year, val: year }];
      let agg: string[] = [];
      for (const yf of yearFilters) {
        const vals = await selectDistinct(supabase, cols.model, [yf, { col: cols.make, val: make }], 20000);
        agg = agg.concat(vals);
        if (agg.length > 50000) break;
      }
      const values = Array.from(new Set(agg.map(String))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "trims") {
      if (!year || !make || !model) return NextResponse.json({ values: [] });
      const yearFilters = buildYearFilters(year) ?? [{ col: cols.year, val: year }];
      let agg: string[] = [];
      for (const yf of yearFilters) {
        const vals = await selectDistinct(supabase, cols.trim, [yf, { col: cols.make, val: make }, { col: cols.model, val: model }], 20000);
        agg = agg.concat(vals);
        if (agg.length > 50000) break;
      }
      const values = Array.from(new Set(agg.map(String))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ values: [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, values: [] }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}


