import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { DatabaseService } from "@/lib/api/database";
import { DropdownService } from "@/lib/api/dropdowns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "years"; // years | makes | models | trims
    const year = url.searchParams.get("year") || "";
    const make = url.searchParams.get("make") || "";
    const model = url.searchParams.get("model") || "";

    // Initialize optimized services
    const supabase = await getServerSupabase();
    const db = new DatabaseService(supabase);
    const dropdownService = new DropdownService(db);

    let values: string[] = [];

    switch (scope) {
      case "years":
        // Provide static range for better UX (covers historical to future models)
        values = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));
        break;

      case "makes":
        // Single optimized query instead of multiple paginated calls
        values = await dropdownService.getMakes(year || undefined);

        // Apply the same normalization as the original code for consistency
        const normalizeMake = (s: string) => {
          let v = String(s || "").trim();
          if (v.startsWith("~") && v.endsWith("~")) v = v.slice(1, -1);
          // Drop parenthetical country/region suffixes
          v = v.replace(/\s*\([^)]*\)\s*$/u, "").trim();
          return v;
        };

        values = Array.from(new Set(values.map(normalizeMake))).sort((a, b) => a.localeCompare(b));
        break;

      case "models":
        if (!make) {
          values = [];
        } else {
          // Single optimized query instead of nested loops
          values = await dropdownService.getModels(make, year || undefined);
          values.sort((a, b) => a.localeCompare(b));
        }
        break;

      case "trims":
        if (!make || !model) {
          values = [];
        } else {
          // Single optimized query instead of deeply nested loops
          values = await dropdownService.getTrims(make, model, year || undefined);
          values.sort((a, b) => a.localeCompare(b));
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


