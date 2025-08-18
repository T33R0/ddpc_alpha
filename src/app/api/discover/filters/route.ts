import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

async function selectDistinct(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  column: string,
  filters?: Array<{ col: string; val: string }>,
  limit = 100000
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
      year: pickColumn(row, ["year", "model_year", "Year"]) || "",
      make: pickColumn(row, ["make", "brand", "Make"]) || "",
      model: pickColumn(row, ["model", "Model"]) || "",
      trim: pickColumn(row, ["trim", "Trim"]) || "",
      body: pickColumn(row, ["body_type", "body_style", "Body type", "Body style"]) || "",
      classification: pickColumn(row, ["car_classification", "class", "segment", "Car classification", "Classification"]) || "",
      drive: pickColumn(row, ["drive_type", "drivetrain", "drive", "Drive type", "Drivetrain"]) || "",
      transmission: pickColumn(row, ["transmission", "transmission_type", "Transmission", "Transmission type"]) || "",
      engine: pickColumn(row, ["engine_type", "engine_configuration", "engine", "engine_config", "Engine configuration", "Engine"]) || "",
      doors: pickColumn(row, ["doors", "Doors"]) || "",
      seating: pickColumn(row, ["total_seating", "seating", "seats", "Total seating", "Seating", "Seats"]) || "",
      fuel: pickColumn(row, ["fuel_type", "fuel", "Fuel type"]) || "",
      country: pickColumn(row, ["country_of_origin", "origin", "country", "Country of origin", "Origin", "Country"]) || "",
    };

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

    // Years: prefer table distinct, else fill 1990..2026
    let years: string[] = [];
    if (columns.year) {
      years = await selectDistinct(supabase, columns.year, undefined, 100000);
      years = Array.from(new Set(years.map(String))).sort((a, b) => Number(b) - Number(a));
    }
    if (years.length === 0) {
      years = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));
    }

    // All lists should show full, unscoped options across vehicle_data (no dependency narrowing)
    const makeFilters = undefined;
    const modelFilters = undefined;
    const trimFilters = undefined;

    const [make, model, trim, body, classification, drive, transmission, engine, doors, seating, fuel, country] = await Promise.all([
      selectDistinct(supabase, columns.make, makeFilters, 100000),
      selectDistinct(supabase, columns.model, modelFilters, 100000),
      selectDistinct(supabase, columns.trim, trimFilters, 100000),
      selectDistinct(supabase, columns.body, undefined, 100000),
      selectDistinct(supabase, columns.classification, undefined, 100000),
      selectDistinct(supabase, columns.drive, undefined, 100000),
      selectDistinct(supabase, columns.transmission, undefined, 100000),
      selectDistinct(supabase, columns.engine, undefined, 100000),
      selectDistinct(supabase, columns.doors, undefined, 100000),
      selectDistinct(supabase, columns.seating, undefined, 100000),
      selectDistinct(supabase, columns.fuel, undefined, 100000),
      selectDistinct(supabase, columns.country, undefined, 100000),
    ]);

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


