import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const YEAR_CANDIDATES = ["year", "model_year", "new_year", "Year"] as const;
const MAKE_CANDIDATES = ["make", "brand", "new_make", "Make"] as const;
const MODEL_CANDIDATES = ["model", "new_model", "Model"] as const;
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
  maxPages = 200
): Promise<string[]> {
  try {
    const seen = new Set<string>();
    let last: string | null = null;
    for (let page = 0; page < maxPages; page++) {
      let q = supabase
        .from("vehicle_data")
        .select(col)
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
      const rows = Array.isArray(data) ? (data as unknown[]) : [];
      if (rows.length === 0) break;
      for (const row of rows) {
        const obj = row as Record<string, unknown>;
        const raw = obj ? obj[col] : undefined;
        const val = raw != null ? String(raw) : '';
        if (val) {
          seen.add(val);
          last = val; // update cursor to latest value in sorted order
        }
      }
      if (rows.length < pageSize) break; // reached the end
      if (seen.size > 100000) break; // guardrail
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
    const present = (cands: readonly string[]) => (row ? cands.filter((c) => c in row) : [...cands]);
    const yearCols = present(YEAR_CANDIDATES);
    const makeCols = present(MAKE_CANDIDATES);
    const modelCols = present(MODEL_CANDIDATES);
    const trimCols = present(TRIM_CANDIDATES);

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
      // Always provide full UX range 1990..2026 (descending) to ensure a complete experience
      const values = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "makes") {
      // Try union across all year candidates to avoid truncation when data spans multiple columns
      const yearFilters = (year ? yearCols.map((c) => ({ col: c, val: year })) : undefined);

      let agg: string[] = [];
      if (yearFilters && yearFilters.length > 0) {
        for (const yf of yearFilters) {
          for (const mk of makeCols) {
            const vals = await selectDistinct(supabase, mk, [yf]);
            agg = agg.concat(vals);
            if (agg.length > 100000) break;
          }
        }
      } else {
        for (const mk of makeCols) {
          const vals = await selectDistinct(supabase, mk, undefined);
          agg = agg.concat(vals);
        }
      }
      // Normalize and dedupe makes (strip tildes and trailing country annotations)
      const normalizeMake = (s: string) => {
        let v = String(s || "").trim();
        if (v.startsWith("~") && v.endsWith("~")) v = v.slice(1, -1);
        // Drop parenthetical country/region suffixes
        v = v.replace(/\s*\([^)]*\)\s*$/u, "").trim();
        return v;
      };
      const values = Array.from(new Set(agg.map(normalizeMake))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "models") {
      if (!year || !make) return NextResponse.json({ values: [] });
      const yearFilters = yearCols.map((c) => ({ col: c, val: year }));
      let agg: string[] = [];
      for (const yf of yearFilters) {
        for (const mk of makeCols) {
          for (const md of modelCols) {
            const vals = await selectDistinct(supabase, md, [yf, { col: mk, val: make }]);
            agg = agg.concat(vals);
            if (agg.length > 100000) break;
          }
        }
      }
      const values = Array.from(new Set(agg.map(String))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "trims") {
      if (!year || !make || !model) return NextResponse.json({ values: [] });
      const yearFilters = yearCols.map((c) => ({ col: c, val: year }));
      let agg: string[] = [];
      for (const yf of yearFilters) {
        for (const mk of makeCols) {
          for (const md of modelCols) {
            for (const tr of trimCols) {
              const vals = await selectDistinct(supabase, tr, [yf, { col: mk, val: make }, { col: md, val: model }]);
              agg = agg.concat(vals);
              if (agg.length > 100000) break;
            }
          }
        }
      }
      const values = Array.from(new Set(agg.map(String))).sort((a, b) => a.localeCompare(b));
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ values: [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, values: [] }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}


