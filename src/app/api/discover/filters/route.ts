import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

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

async function pickColDynamic(supabase: Awaited<ReturnType<typeof getServerSupabase>>, candidates: string[]): Promise<string> {
  for (const c of candidates) {
    try {
      const { data } = await supabase.from("vehicle_data").select(c).limit(1);
      if (Array.isArray(data) && data.length > 0 && Object.prototype.hasOwnProperty.call(data[0] as object, c)) {
        return c;
      }
    } catch {}
  }
  return "";
}

async function fetchDistinct(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  column: string,
  max = 20000,
  batch = 2000
): Promise<string[]> {
  if (!column) return [];
  const seen = new Set<string>();
  for (let start = 0; start < max; start += batch) {
    const { data } = await supabase
      .from("vehicle_data")
      .select(column)
      .not(column, "is", null)
      .order(column as string, { ascending: true })
      .range(start, start + batch - 1);
    const rows = (data as Array<Record<string, unknown>> | null) ?? [];
    for (const r of rows) {
      const v = r[column];
      if (v != null && v !== "") seen.add(String(v));
    }
    if (rows.length < batch) break;
  }
  return Array.from(seen);
}

export async function GET(): Promise<Response> {
  try {
    const supabase = await getServerSupabase();

    const columns: Columns = {
      year: await pickColDynamic(supabase, ["year", "model_year"]) || "",
      make: await pickColDynamic(supabase, ["make", "brand"]) || "",
      model: await pickColDynamic(supabase, ["model"]) || "",
      trim: await pickColDynamic(supabase, ["trim"]) || "",
      body: await pickColDynamic(supabase, ["body_type", "body_style"]) || "",
      classification: await pickColDynamic(supabase, ["car_classification", "class", "segment"]) || "",
      drive: await pickColDynamic(supabase, ["drive_type", "drivetrain", "drive"]) || "",
      transmission: await pickColDynamic(supabase, ["transmission", "transmission_type"]) || "",
      engine: await pickColDynamic(supabase, ["engine_type", "engine_configuration", "engine", "engine_config"]) || "",
      doors: await pickColDynamic(supabase, ["doors"]) || "",
      seating: await pickColDynamic(supabase, ["total_seating", "seating", "seats"]) || "",
      fuel: await pickColDynamic(supabase, ["fuel_type", "fuel"]) || "",
      country: await pickColDynamic(supabase, ["country_of_origin", "origin", "country"]) || "",
    };

    // Years: prefer table distinct, else fill 1990..2026
    let years: string[] = [];
    if (columns.year) {
      years = await fetchDistinct(supabase, columns.year);
      // ensure numeric sort desc
      years = Array.from(new Set(years.map(y => String(y)))).sort((a, b) => Number(b) - Number(a));
    }
    if (years.length === 0) {
      years = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));
    }

    const [make, body, classification, drive, transmission, engine, doors, seating, fuel, country] = await Promise.all([
      fetchDistinct(supabase, columns.make),
      fetchDistinct(supabase, columns.body),
      fetchDistinct(supabase, columns.classification),
      fetchDistinct(supabase, columns.drive),
      fetchDistinct(supabase, columns.transmission),
      fetchDistinct(supabase, columns.engine),
      fetchDistinct(supabase, columns.doors),
      fetchDistinct(supabase, columns.seating),
      fetchDistinct(supabase, columns.fuel),
      fetchDistinct(supabase, columns.country),
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
        "cache-control": "public, s-maxage=600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
  }
}


