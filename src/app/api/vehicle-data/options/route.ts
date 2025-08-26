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
  filters?: Array<{ col: string; val: string | number }>
): Promise<string[]> {
  try {
    // Use a more efficient approach: get distinct values directly
    // First try with a reasonable limit, then if we hit the limit, use a sampling approach
    let q = supabase
      .from("vehicle_data")
      .select(col, { count: "exact" })
      .not(col, "is", null);

    if (filters) {
      for (const f of filters) q = q.eq(f.col, f.val as unknown as string);
    }

    // Try to get all distinct values in one query with a high limit
    const { data, count } = await q.limit(100000);

    if (data && Array.isArray(data)) {
      const uniqueValues = Array.from(new Set(
        data
          .map(row => String((row as Record<string, unknown>)[col]))
          .filter(val => val && val.trim())
      ));

      // If we got all values (count <= our limit), return them
      if (count && count <= 100000) {
        return uniqueValues.sort((a, b) => a.localeCompare(b));
      }

      // If we hit the limit, use a more targeted approach
      console.log(`Hit limit for ${col}, got ${uniqueValues.length} unique values out of ${count} total rows`);

      // For large datasets, get distinct values using a windowing approach with smaller batches
      const allValues = new Set(uniqueValues);
      let offset = 0;
      const batchSize = 50000;

      while (offset < (count || 0)) {
        let batchQuery = supabase
          .from("vehicle_data")
          .select(col)
          .not(col, "is", null)
          .range(offset, offset + batchSize - 1);

        if (filters) {
          for (const f of filters) batchQuery = batchQuery.eq(f.col, f.val as unknown as string);
        }

        const { data: batchData } = await batchQuery;
        if (!batchData || !Array.isArray(batchData) || batchData.length === 0) break;

        for (const row of batchData) {
          const val = String((row as Record<string, unknown>)[col]);
          if (val && val.trim()) {
            allValues.add(val);
          }
        }

        offset += batchSize;
        if (allValues.size > 50000) break; // safety limit
      }

      return Array.from(allValues).sort((a, b) => a.localeCompare(b));
    }

    return [];
  } catch (error) {
    console.error('Error in selectDistinct:', error);
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
      let values = await selectDistinct(supabase, cols.year, undefined);
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
          const vals = await selectDistinct(supabase, cols.make, [yf]);
          agg = agg.concat(vals);
          if (agg.length > 50000) break;
        }
      } else {
        agg = await selectDistinct(supabase, cols.make, undefined);
      }
      const values = Array.from(new Set(agg.map(String))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "models") {
      if (!year || !make) return NextResponse.json({ values: [] });
      const yearFilters = buildYearFilters(year) ?? [{ col: cols.year, val: year }];
      let agg: string[] = [];
      for (const yf of yearFilters) {
        const vals = await selectDistinct(supabase, cols.model, [yf, { col: cols.make, val: make }]);
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
        const vals = await selectDistinct(supabase, cols.trim, [yf, { col: cols.make, val: make }, { col: cols.model, val: model }]);
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


