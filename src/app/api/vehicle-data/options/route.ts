import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "years"; // years | makes | models | trims
    const year = url.searchParams.get("year") || "";
    const make = url.searchParams.get("make") || "";
    const model = url.searchParams.get("model") || "";

    console.log("Vehicle options API called:", { scope, year, make, model });

    const supabase = await getServerSupabase();
    let values: string[] = [];

    switch (scope) {
      case "years":
        // Provide static range for better UX (covers historical to future models)
        values = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));
        break;

      case "makes":
        // Get distinct makes from existing vehicles
        let query = supabase
          .from("vehicle")
          .select("make")
          .not("make", "is", null);

        // If year is specified, filter by year
        if (year) {
          query = query.eq("year", parseInt(year));
        }

        const { data: makesData, error: makesError } = await query.order("make");

        console.log("Makes API called with year:", year, "data:", makesData?.length || 0, "items");

        if (makesError) {
          console.error("Makes query error:", makesError);
          values = [];
        } else {
          // Extract unique makes and normalize
          const makesSet = new Set<string>();
          makesData?.forEach((item: any) => {
            if (item.make) {
              let make = String(item.make).trim();
              // Apply normalization like the original code
              if (make.startsWith("~") && make.endsWith("~")) {
                make = make.slice(1, -1);
              }
              make = make.replace(/\s*\([^)]*\)\s*$/u, "").trim();
              if (make) makesSet.add(make);
            }
          });
          values = Array.from(makesSet).sort((a, b) => a.localeCompare(b));
          console.log("Makes processed:", values.length, "unique makes:", values);

          // If no makes found and no year filter, provide some fallback popular makes
          if (values.length === 0 && !year) {
            console.log("No makes found, providing fallback makes");
            values = ["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes-Benz", "Audi", "Nissan", "Hyundai", "Kia"];
          }
        }
        break;

      case "models":
        if (!make) {
          values = [];
        } else {
          // Get distinct models for the selected make
          const { data: modelsData, error: modelsError } = await supabase
            .from("vehicle")
            .select("model")
            .eq("make", make)
            .not("model", "is", null)
            .order("model");

          console.log("Models API called for make:", make, "data:", modelsData?.length || 0, "items");

          if (modelsError) {
            console.error("Models query error:", modelsError);
            values = [];
          } else {
            const modelsSet = new Set<string>();
            modelsData?.forEach((item: any) => {
              if (item.model) {
                const model = String(item.model).trim();
                if (model) modelsSet.add(model);
              }
            });
            values = Array.from(modelsSet).sort((a, b) => a.localeCompare(b));
            console.log("Models processed:", values.length, "unique models:", values);

            // If no models found, provide some common models for popular makes
            if (values.length === 0) {
              const commonModels: Record<string, string[]> = {
                "Toyota": ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma"],
                "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Fit"],
                "Ford": ["F-150", "Explorer", "Escape", "Mustang", "Focus"],
                "Chevrolet": ["Silverado", "Equinox", "Malibu", "Traverse", "Tahoe"],
                "BMW": ["3 Series", "5 Series", "X3", "X5", "7 Series"],
                "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "S-Class"],
                "Audi": ["A3", "A4", "Q5", "Q7", "A6"],
                "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder", "Titan"],
                "Hyundai": ["Sonata", "Elantra", "Tucson", "Santa Fe", "Kona"],
                "Kia": ["Sorento", "Sportage", "Telluride", "Soul", "Optima"]
              };
              values = commonModels[make] || [`${make} Model`];
              console.log("No models found, providing fallback models:", values);
            }
          }
        }
        break;

      case "trims":
        if (!make || !model) {
          values = [];
        } else {
          // Get distinct trims for the selected make and model
          const { data: trimsData, error: trimsError } = await supabase
            .from("vehicle")
            .select("trim")
            .eq("make", make)
            .eq("model", model)
            .not("trim", "is", null)
            .order("trim");

          console.log("Trims API called for make:", make, "model:", model, "data:", trimsData?.length || 0, "items");

          if (trimsError) {
            console.error("Trims query error:", trimsError);
            values = [];
          } else {
            const trimsSet = new Set<string>();
            trimsData?.forEach((item: any) => {
              if (item.trim) {
                const trim = String(item.trim).trim();
                if (trim) trimsSet.add(trim);
              }
            });
            values = Array.from(trimsSet).sort((a, b) => a.localeCompare(b));
            console.log("Trims processed:", values.length, "unique trims:", values);

            // If no trims found, provide some common trims
            if (values.length === 0) {
              values = ["Base", "LX", "EX", "EX-L", "Premium", "Limited", "Platinum"];
              console.log("No trims found, providing fallback trims:", values);
            }
          }
        }
        break;

      default:
        values = [];
    }

    return NextResponse.json(
      { values },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
        }
      }
    );

  } catch (error) {
    console.error("Vehicle options API error:", error);
    return NextResponse.json(
      { error: (error as Error).message, values: [] },
      {
        status: 500,
        headers: { "Cache-Control": "public, s-maxage=60" }
      }
    );
  }
}


