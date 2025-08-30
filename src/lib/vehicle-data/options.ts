import { getServerSupabase } from "@/lib/supabase";

// Helper to select distinct values from vehicle_data
async function distinct(
  column: string,
  filters: Record<string, string | number | undefined> = {},
  sort: { ascending: boolean } = { ascending: true }
): Promise<string[]> {
  const supabase = await getServerSupabase();
  let q = supabase.from("vehicle_data").select(column).not(column, "is", null);
  for (const [col, val] of Object.entries(filters)) {
    if (val != null) q = q.eq(col, val);
  }
  const { data, error } = await q.order(column, sort).limit(2000);
  if (error) {
    console.error("distinct query error", error);
    return [];
  }
  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return Array.from(
    new Set(
      rows.map((r) => {
        const v = r[column as keyof typeof r];
        return v == null ? "" : String(v).trim();
      })
    )
  ).filter(Boolean);
}

export async function getYears(): Promise<string[]> {
  const years = await distinct("year", {}, { ascending: false });
  // Ensure numeric descending order
  return years.sort((a, b) => Number(b) - Number(a));
}

export async function getMakes(year?: string): Promise<string[]> {
  const filters: Record<string, string | number> = {};
  if (year) filters.year = Number(year);
  return distinct("make", filters, { ascending: true });
}

export async function getModels(year?: string, make?: string): Promise<string[]> {
  const filters: Record<string, string | number> = {};
  if (year) filters.year = Number(year);
  if (make) filters.make = make;
  return distinct("model", filters, { ascending: true });
}

export async function getTrims(year?: string, make?: string, model?: string): Promise<string[]> {
  const filters: Record<string, string | number> = {};
  if (year) filters.year = Number(year);
  if (make) filters.make = make;
  if (model) filters.model = model;
  return distinct("trim", filters, { ascending: true });
}

export { distinct as getDistinctOptions };

