import { NextResponse } from "next/server";
import { getYears, getMakes, getModels, getTrims } from "@/lib/vehicle-data/options";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "years";
    const year = url.searchParams.get("year") || undefined;
    const make = url.searchParams.get("make") || undefined;
    const model = url.searchParams.get("model") || undefined;

    let values: string[] = [];
    switch (scope) {
      case "years":
        values = await getYears();
        break;
      case "makes":
        values = await getMakes(year);
        break;
      case "models":
        values = await getModels(year, make);
        break;
      case "trims":
        values = await getTrims(year, make, model);
        break;
      default:
        values = [];
    }

    return NextResponse.json(
      { values },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error) {
    console.error("Vehicle options API error:", error);
    return NextResponse.json(
      { error: (error as Error).message, values: [] },
      { status: 500 }
    );
  }
}
