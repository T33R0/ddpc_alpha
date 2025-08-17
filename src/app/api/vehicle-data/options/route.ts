import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Columns = {
  year: string;
  make: string;
  model: string;
  trim: string;
};

function pickColumn(row: Record<string, unknown> | null, candidates: string[]): string | null {
  if (!row) return candidates[0] ?? null;
  for (const c of candidates) { if (c in row) return c; }
  return null;
}

async function getColumns() : Promise<Columns> {
  const supabase = await getServerSupabase();
  const probe = await supabase.from("vehicle_data").select("*").limit(1);
  const probeRow = Array.isArray(probe.data) && probe.data.length > 0 ? (probe.data[0] as Record<string, unknown>) : null;
  return {
    year: pickColumn(probeRow, ["year", "model_year"]) || "year",
    make: pickColumn(probeRow, ["make", "brand"]) || "make",
    model: pickColumn(probeRow, ["model"]) || "model",
    trim: pickColumn(probeRow, ["trim"]) || "trim",
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "years"; // years | makes | models | trims
    const year = url.searchParams.get("year") || "";
    const make = url.searchParams.get("make") || "";
    const model = url.searchParams.get("model") || "";

    const supabase = await getServerSupabase();
    const cols = await getColumns();

    if (scope === "years") {
      const { data } = await supabase
        .from("vehicle_data")
        .select(`${cols.year}`, { head: false, count: "exact" })
        .not(cols.year, "is", null)
        .order(cols.year, { ascending: false })
        .limit(500);
      const rows = (data as unknown as Array<Record<string, string | number>> | null) ?? [];
      const values = Array.from(new Set(rows.map(v => String(v[cols.year as keyof typeof v])))).filter(Boolean);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "makes") {
      let q = supabase.from("vehicle_data").select(`${cols.make}`, { head: false, count: "exact" });
      if (year) q = q.eq(cols.year, year);
      const { data } = await q.not(cols.make, "is", null).order(cols.make, { ascending: true }).limit(500);
      const rows = (data as unknown as Array<Record<string, string>> | null) ?? [];
      const values = Array.from(new Set(rows.map(v => String(v[cols.make as keyof typeof v])))).filter(Boolean);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "models") {
      if (!year || !make) return NextResponse.json({ values: [] });
      const { data } = await supabase
        .from("vehicle_data")
        .select(`${cols.model}`, { head: false, count: "exact" })
        .eq(cols.year, year)
        .eq(cols.make, make)
        .not(cols.model, "is", null)
        .order(cols.model, { ascending: true })
        .limit(500);
      const rows = (data as unknown as Array<Record<string, string>> | null) ?? [];
      const values = Array.from(new Set(rows.map(v => String(v[cols.model as keyof typeof v])))).filter(Boolean);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    if (scope === "trims") {
      if (!year || !make || !model) return NextResponse.json({ values: [] });
      const { data } = await supabase
        .from("vehicle_data")
        .select(`${cols.trim}`, { head: false, count: "exact" })
        .eq(cols.year, year)
        .eq(cols.make, make)
        .eq(cols.model, model)
        .not(cols.trim, "is", null)
        .order(cols.trim, { ascending: true })
        .limit(500);
      const rows = (data as unknown as Array<Record<string, string>> | null) ?? [];
      const values = Array.from(new Set(rows.map(v => String(v[cols.trim as keyof typeof v])))).filter(Boolean);
      return NextResponse.json({ values }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ values: [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, values: [] }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}


