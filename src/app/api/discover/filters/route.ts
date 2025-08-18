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
  limit = 500
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

export async function GET(): Promise<Response> {
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
      year: pickColumn(row, ["year", "model_year"]) || "",
      make: pickColumn(row, ["make", "brand"]) || "",
      model: pickColumn(row, ["model"]) || "",
      trim: pickColumn(row, ["trim"]) || "",
      body: pickColumn(row, ["body_type", "body_style"]) || "",
      classification: pickColumn(row, ["car_classification", "class", "segment"]) || "",
      drive: pickColumn(row, ["drive_type", "drivetrain", "drive"]) || "",
      transmission: pickColumn(row, ["transmission", "transmission_type"]) || "",
      engine: pickColumn(row, ["engine_type", "engine_configuration", "engine", "engine_config"]) || "",
      doors: pickColumn(row, ["doors"]) || "",
      seating: pickColumn(row, ["total_seating", "seating", "seats"]) || "",
      fuel: pickColumn(row, ["fuel_type", "fuel"]) || "",
      country: pickColumn(row, ["country_of_origin", "origin", "country"]) || "",
    };

    // Years: prefer table distinct, else fill 1990..2026
    let years: string[] = [];
    if (columns.year) {
      years = await selectDistinct(supabase, columns.year, undefined, 1000);
      years = Array.from(new Set(years.map(String))).sort((a, b) => Number(b) - Number(a));
    }
    if (years.length === 0) {
      years = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));
    }

    const [make, body, classification, drive, transmission, engine, doors, seating, fuel, country] = await Promise.all([
      selectDistinct(supabase, columns.make),
      selectDistinct(supabase, columns.body),
      selectDistinct(supabase, columns.classification),
      selectDistinct(supabase, columns.drive),
      selectDistinct(supabase, columns.transmission),
      selectDistinct(supabase, columns.engine),
      selectDistinct(supabase, columns.doors),
      selectDistinct(supabase, columns.seating),
      selectDistinct(supabase, columns.fuel),
      selectDistinct(supabase, columns.country),
    ]);

    const payload = {
      columns,
      options: {
        year: years,
        make,
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


