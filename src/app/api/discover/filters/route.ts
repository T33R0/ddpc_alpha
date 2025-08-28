import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const YEAR_CANDIDATES = ["year", "model_year", "Year"] as const;
const MAKE_CANDIDATES = ["make", "brand", "Make"] as const;
const MODEL_CANDIDATES = ["model", "Model"] as const;
const TRIM_CANDIDATES = ["trim", "Trim"] as const;
const BODY_CANDIDATES = ["body_type", "body_style", "Body type", "Body style"] as const;
const CLASS_CANDIDATES = ["car_classification", "class", "segment", "Car classification", "Classification"] as const;
const DRIVE_CANDIDATES = ["drive_type", "drivetrain", "drive", "Drive type", "Drivetrain"] as const;
const TRANS_CANDIDATES = ["transmission", "transmission_type", "Transmission", "Transmission type"] as const;
const ENGINE_CANDIDATES = ["engine_type", "engine_configuration", "engine", "engine_config", "Engine configuration", "Engine"] as const;
const DOORS_CANDIDATES = ["doors", "Doors"] as const;
const SEATING_CANDIDATES = ["total_seating", "seating", "seats", "Total seating", "Seating", "Seats"] as const;
const FUEL_CANDIDATES = ["fuel_type", "fuel", "Fuel type"] as const;
const COUNTRY_CANDIDATES = ["country_of_origin", "origin", "country", "Country of origin", "Origin", "Country"] as const;

type Columns = {
  year: string;
  make: string;
  model: string;
  trim: string;
  body: string;
  classification: string;
  drive: string;
  transmission: string;
  engine: string;
  doors: string;
  seating: string;
  fuel: string;
  country: string;
};

function pickColumn(row: Record<string, unknown> | null, candidates: string[]): string {
  if (!row) return candidates[0] ?? "";
  for (const c of candidates) {
    if (c in row) return c;
  }
  return candidates[0] ?? "";
}

function present(row: Record<string, unknown> | null, candidates: readonly string[]): string[] {
  if (!row) return [...candidates];
  return candidates.filter((c) => c in row);
}

async function selectDistinctCursor(
  supabase: SupabaseClient,
  column: string,
  filters?: Array<{ col: string; val: string }>,
  pageSize = 10000,
  maxPages = 200
): Promise<string[]> {
  try {
    const seen = new Set<string>();
    let last: string | null = null;
    for (let page = 0; page < maxPages; page++) {
      let q = supabase
        .from("vehicle_data")
        .select(column)
        .not(column, "is", null)
        .order(column, { ascending: true });
      if (filters) for (const f of filters) q = q.eq(f.col, f.val);
      if (last !== null) q = q.gt(column, last);
      const { data } = await q.limit(pageSize);
      const rows = Array.isArray(data) ? (data as unknown as Array<Record<string, unknown>>) : [];
      if (rows.length === 0) break;
      for (const row of rows) {
        const valRaw = row[column as keyof typeof row];
        const val = valRaw == null ? "" : String(valRaw);
        if (val) {
          seen.add(val);
          last = val;
        }
      }
      if (rows.length < pageSize) break;
      if (seen.size > 100000) break;
    }
    return Array.from(seen);
  } catch {
    return [];
  }
}

async function selectDistinctMany(
  supabase: SupabaseClient,
  columns: string[],
  filters?: Array<{ col: string; val: string }>,
  pageSize?: number
): Promise<string[]> {
  let agg: string[] = [];
  for (const col of columns) {
    const vals = await selectDistinctCursor(supabase, col, filters, pageSize ?? 10000);
    agg = agg.concat(vals);
    if (agg.length > 100000) break;
  }
  return Array.from(new Set(agg.map(String)));
}

async function selectDistinct(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  column: string,
  filters?: Array<{ col: string; val: string }>,
  limit = 2000
): Promise<string[]> {
  if (!column) return [];
  try {
    let q = supabase.from("vehicle_data").select(column, { head: false, count: "planned" }).not(column, "is", null);
    if (filters) for (const f of filters) q = q.eq(f.col, f.val);
    const { data } = await q.order(column as string, { ascending: true }).limit(limit);
    const rows = (data as Array<Record<string, string | number>> | null) ?? [];
    return Array.from(new Set(rows.map(v => String(v[column as keyof typeof v])))).filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET(req: Request): Promise<Response> {
  try {
    // Prefer service-role server-side to ensure public filter reads regardless of anon RLS
    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase: SupabaseClient = (adminUrl && serviceKey)
      ? createClient(adminUrl, serviceKey, { auth: { persistSession: false } })
      : await getServerSupabase();
    // Single probe to infer columns
    const probe = await supabase.from("vehicle_data").select("*").limit(1);
    const row = Array.isArray(probe.data) && probe.data.length > 0 ? (probe.data[0] as Record<string, unknown>) : null;

    const columns: Columns = {
      year: pickColumn(row, [...YEAR_CANDIDATES]) || "",
      make: pickColumn(row, [...MAKE_CANDIDATES]) || "",
      model: pickColumn(row, [...MODEL_CANDIDATES]) || "",
      trim: pickColumn(row, [...TRIM_CANDIDATES]) || "",
      body: pickColumn(row, [...BODY_CANDIDATES]) || "",
      classification: pickColumn(row, [...CLASS_CANDIDATES]) || "",
      drive: pickColumn(row, [...DRIVE_CANDIDATES]) || "",
      transmission: pickColumn(row, [...TRANS_CANDIDATES]) || "",
      engine: pickColumn(row, [...ENGINE_CANDIDATES]) || "",
      doors: pickColumn(row, [...DOORS_CANDIDATES]) || "",
      seating: pickColumn(row, [...SEATING_CANDIDATES]) || "",
      fuel: pickColumn(row, [...FUEL_CANDIDATES]) || "",
      country: pickColumn(row, [...COUNTRY_CANDIDATES]) || "",
    };

    const yearCols = present(row, YEAR_CANDIDATES as unknown as string[]);
    const makeCols = present(row, MAKE_CANDIDATES as unknown as string[]);
    const modelCols = present(row, MODEL_CANDIDATES as unknown as string[]);
    const trimCols = present(row, TRIM_CANDIDATES as unknown as string[]);
    const bodyCols = present(row, BODY_CANDIDATES as unknown as string[]);
    const classCols = present(row, CLASS_CANDIDATES as unknown as string[]);
    const driveCols = present(row, DRIVE_CANDIDATES as unknown as string[]);
    const transCols = present(row, TRANS_CANDIDATES as unknown as string[]);
    const engineCols = present(row, ENGINE_CANDIDATES as unknown as string[]);
    const doorsCols = present(row, DOORS_CANDIDATES as unknown as string[]);
    const seatingCols = present(row, SEATING_CANDIDATES as unknown as string[]);
    const fuelCols = present(row, FUEL_CANDIDATES as unknown as string[]);
    const countryCols = present(row, COUNTRY_CANDIDATES as unknown as string[]);

    // Parse current selections from query string to constrain option lists
    const url = new URL(req.url);
    const selYear = url.searchParams.get("year") || undefined;
    const selMake = url.searchParams.get("make") || undefined;
    const selModel = url.searchParams.get("model") || undefined;
    const selTrim = url.searchParams.get("trim") || undefined;

    const baseFilters: Array<{ col: string; val: string }> = [];
    if (selYear && columns.year) baseFilters.push({ col: columns.year, val: selYear });
    // We only include make/model/trim in base for non-dependent lists so they narrow too
    if (selMake && columns.make) baseFilters.push({ col: columns.make, val: selMake });
    if (selModel && columns.model) baseFilters.push({ col: columns.model, val: selModel });
    if (selTrim && columns.trim) baseFilters.push({ col: columns.trim, val: selTrim });

    // Years: Always return full UX range 1990..2026 (descending)
    const years: string[] = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));

    // Dependent lists: make depends on year; model depends on year+make; trim depends on year+make+model
    // Build filters against all possible columns to avoid truncation when data is split across multiple columns
    const makeFiltersSets = selYear ? yearCols.map((c) => [{ col: c, val: selYear }]) : [undefined];
    const modelFiltersSets = (selYear || selMake)
      ? [
          ...(
            selYear ? yearCols.map((c) => [{ col: c, val: selYear }]) : [ [] as Array<{ col: string; val: string }> ]
          ).map((arr) => (selMake ? [...arr, ...makeCols.map((m) => ({ col: m, val: selMake }))] : arr))
        ]
      : [undefined];
    const trimFiltersSets = (selYear || selMake || selModel)
      ? [
          ...(
            selYear ? yearCols.map((c) => [{ col: c, val: selYear }]) : [ [] as Array<{ col: string; val: string }> ]
          ).map((arr) => {
            let cur = arr;
            if (selMake) cur = [...cur, ...makeCols.map((m) => ({ col: m, val: selMake }))];
            if (selModel) cur = [...cur, ...modelCols.map((m) => ({ col: m, val: selModel }))];
            return cur;
          })
        ]
      : [undefined];

    // Compute options by unioning across present columns with cursor-based scanning
    const make = await (async () => {
      let agg: string[] = [];
      for (const f of makeFiltersSets) {
        const vals = await selectDistinctMany(supabase, makeCols.length ? makeCols : [columns.make], f);
        agg = agg.concat(vals);
        if (agg.length > 100000) break;
      }
      return Array.from(new Set(agg.map(String))).sort((a, b) => a.localeCompare(b));
    })();

    const model = await (async () => {
      let agg: string[] = [];
      for (const f of modelFiltersSets) {
        const vals = await selectDistinctMany(supabase, modelCols.length ? modelCols : [columns.model], f);
        agg = agg.concat(vals);
        if (agg.length > 100000) break;
      }
      return Array.from(new Set(agg.map(String))).sort((a, b) => a.localeCompare(b));
    })();

    const trim = await (async () => {
      let agg: string[] = [];
      for (const f of trimFiltersSets) {
        const vals = await selectDistinctMany(supabase, trimCols.length ? trimCols : [columns.trim], f);
        agg = agg.concat(vals);
        if (agg.length > 100000) break;
      }
      return Array.from(new Set(agg.map(String))).sort((a, b) => a.localeCompare(b));
    })();

    const body = (await selectDistinctMany(supabase, bodyCols.length ? bodyCols : [columns.body])).sort((a, b) => a.localeCompare(b));
    const classification = (await selectDistinctMany(supabase, classCols.length ? classCols : [columns.classification])).sort((a, b) => a.localeCompare(b));
    const drive = (await selectDistinctMany(supabase, driveCols.length ? driveCols : [columns.drive])).sort((a, b) => a.localeCompare(b));
    const transmission = (await selectDistinctMany(supabase, transCols.length ? transCols : [columns.transmission])).sort((a, b) => a.localeCompare(b));
    const engine = (await selectDistinctMany(supabase, engineCols.length ? engineCols : [columns.engine])).sort((a, b) => a.localeCompare(b));
    const doors = (await selectDistinctMany(supabase, doorsCols.length ? doorsCols : [columns.doors])).sort((a, b) => a.localeCompare(b));
    const seating = (await selectDistinctMany(supabase, seatingCols.length ? seatingCols : [columns.seating])).sort((a, b) => a.localeCompare(b));
    const fuel = (await selectDistinctMany(supabase, fuelCols.length ? fuelCols : [columns.fuel])).sort((a, b) => a.localeCompare(b));
    const country = (await selectDistinctMany(supabase, countryCols.length ? countryCols : [columns.country])).sort((a, b) => a.localeCompare(b));

    const payload = {
      columns,
      options: {
        year: years,
        make,
        model,
        trim,
        body,
        classification,
        drive,
        transmission,
        engine,
        doors,
        seating,
        fuel,
        country,
      },
    };

    return new NextResponse(JSON.stringify(payload), {
      headers: {
        "content-type": "application/json",
        "cache-control": "public, s-maxage=900, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
  }
}


