import { NextResponse } from "next/server";
import { getYears, getMakes, getModels, getTrims, getDistinctOptions } from "@/lib/vehicle-data/options";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get("year") || undefined;
    const make = url.searchParams.get("make") || undefined;
    const model = url.searchParams.get("model") || undefined;
    const trim = url.searchParams.get("trim") || undefined;

    const baseFilters: Record<string, string | number> = {};
    if (year) baseFilters.year = Number(year);
    if (make) baseFilters.make = make;
    if (model) baseFilters.model = model;
    if (trim) baseFilters.trim = trim;

    const [years, makes, models, trims, body, classification, drive, transmission, engine, doorsRaw, seatingRaw, fuel, country] = await Promise.all([
      getYears(),
      getMakes(year),
      getModels(year, make),
      getTrims(year, make, model),
      getDistinctOptions("body_type", baseFilters),
      getDistinctOptions("car_classification", baseFilters),
      getDistinctOptions("drive_type", baseFilters),
      getDistinctOptions("transmission", baseFilters),
      getDistinctOptions("engine_configuration", baseFilters),
      getDistinctOptions("doors", baseFilters),
      getDistinctOptions("seating", baseFilters),
      getDistinctOptions("fuel_type", baseFilters),
      getDistinctOptions("country_of_origin", baseFilters),
    ]);

    const doors = doorsRaw.sort((a, b) => Number(a) - Number(b));
    const seating = seatingRaw.sort((a, b) => Number(a) - Number(b));

    return NextResponse.json(
      {
        options: {
          year: years,
          make: makes,
          model: models,
          trim: trims,
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
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400",
        },
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
  }
}
