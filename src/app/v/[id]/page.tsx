import { getServerSupabase } from "@/lib/supabase";
import Link from "next/link";
import { sanitizeVehicleForPublic } from "@/lib/public/sanitize";
import type { Metadata } from "next";
import VehicleHeader from "@/components/vehicle/VehicleHeader";
import VehicleSpecSheet from "@/components/vehicle/VehicleSpecSheet";
import { getVehicleCoverUrl } from "@/lib/getVehicleCoverUrl";

export const dynamic = "force-dynamic";

// Public view row and mapped event types (no any)
type PublicEventRow = {
  id: string;
  vehicle_id: string;
  occurred_at: string;
  type: "SERVICE" | "INSTALL" | "INSPECT" | "TUNE" | string;
  display_title: string;
};

type SanitizerInputEvent = {
  id: string;
  created_at: string;
  notes: string;
  type: PublicEventRow["type"];
};

// Narrow type guard to validate public view rows without using 'any'
function isPublicEventRow(r: unknown): r is PublicEventRow {
  if (typeof r !== "object" || r === null) return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.vehicle_id === "string" &&
    typeof o.occurred_at === "string" &&
    typeof o.type === "string" &&
    typeof o.display_title === "string"
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const supabase = await getServerSupabase();
  const { id } = await params;
  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname, privacy")
    .eq("id", id)
    .maybeSingle();
  const titleName = vehicle?.nickname?.trim()
    ? vehicle.nickname
    : [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
  return {
    title: `${titleName || "Vehicle"} • MyDDPC`,
    openGraph: {
      title: `${titleName || "Vehicle"} • MyDDPC`,
      type: "website",
      images: [{ url: `/v/${id}/opengraph-image` }],
    },
  };
}

export default async function PublicVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await getServerSupabase();
  const { id } = await params;

  const { data: vehicle, error } = await supabase
    .from("vehicle")
    .select("id, vin, year, make, model, trim, nickname, privacy, photo_url, garage_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return <div className="space-y-4"><h1 className="text-2xl font-semibold">Vehicle</h1><p className="text-red-600">{error.message}</p></div>;
  }
  if (!vehicle) {
    return <div className="space-y-4"><h1 className="text-2xl font-semibold">Vehicle</h1><p className="text-gray-600">Not found.</p></div>;
  }
  if (vehicle.privacy !== "PUBLIC") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{vehicle.nickname ?? `${vehicle.year ?? ''} ${vehicle.make} ${vehicle.model}`}</h1>
        <p className="text-gray-600">This vehicle is private.</p>
        <Link className="text-blue-600 hover:underline" href="/">Go home</Link>
      </div>
    );
  }

  // Fetch public-safe events via whitelist view
  const { data } = await supabase
    .from("public_events")
    .select("id, vehicle_id, occurred_at, type, display_title")
    .eq("vehicle_id", id)
    .order("occurred_at", { ascending: false })
    .limit(5);

  // Validate and type rows without resorting to 'any'
  const raw: unknown[] = Array.isArray(data) ? data : [];
  const rows: PublicEventRow[] = raw.filter(isPublicEventRow);

  // Normalize to sanitizer input shape (defense-in-depth)
  const eventsForSanitize: SanitizerInputEvent[] = rows.map((e) => ({
    id: e.id,
    notes: e.display_title ?? "",
    created_at: e.occurred_at,
    type: e.type,
  }));

  const safe = sanitizeVehicleForPublic(vehicle, eventsForSanitize);
  const coverUrl = await getVehicleCoverUrl(supabase, id, vehicle.photo_url ?? null);

  // Fetch specs similar to private view but more robust
  let specs: Record<string, string | number | null> | undefined = undefined;
  try {
    if (safe.year && safe.make && safe.model) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const wantMake = normalize(String(safe.make));
      const wantModel = normalize(String(safe.model));
      const makeVal = String(safe.make);
      const modelVal = String(safe.model);

      // Try direct combinations first
      const tryCombos: Array<{ y: string; m: string; d: string }> = [
        { y: "year", m: "make", d: "model" },
        { y: "new_year", m: "make", d: "model" },
        { y: "year", m: "new_make", d: "new_model" },
        { y: "new_year", m: "new_make", d: "new_model" },
      ];
      for (const c of tryCombos) {
        const { data } = await supabase
          .from("vehicle_data")
          .select("*")
          .eq(c.y, safe.year as number)
          .ilike(c.m, `%${makeVal}%`)
          .ilike(c.d, `%${modelVal}%`)
          .limit(1);
        const r = Array.isArray(data) && data[0] ? (data[0] as Record<string, string | number | null>) : null;
        if (r) { specs = r; break; }
      }

      if (!specs) {
        // Final fallback: ignore year, prefer newest
        const { data } = await supabase
          .from("vehicle_data")
          .select("*")
          .ilike("make", `%${makeVal}%`)
          .ilike("model", `%${modelVal}%`)
          .order("year", { ascending: false })
          .limit(1);
        const r2 = Array.isArray(data) && data[0] ? (data[0] as Record<string, string | number | null>) : null;
        if (r2) specs = r2;
      }

      if (!specs) {
        // Fallback: year scan + normalize
        const { data: rows } = await supabase
          .from("vehicle_data")
          .select("*")
          .or(`year.eq.${safe.year},new_year.eq.${safe.year},model_year.eq.${safe.year}`)
          .limit(500);
        const list: Array<Record<string, string | number | null>> = Array.isArray(rows) ? (rows as Array<Record<string, string | number | null>>) : [];
        const getStr = (o: Record<string, unknown>, k: string): string | null => typeof o[k] === "string" && o[k] ? String(o[k]) : null;
        const pickRow = list.find((r) => {
          const candMake = getStr(r as Record<string, unknown>, "make") || getStr(r as Record<string, unknown>, "new_make") || getStr(r as Record<string, unknown>, "Make") || "";
          const candModel = getStr(r as Record<string, unknown>, "model") || getStr(r as Record<string, unknown>, "new_model") || getStr(r as Record<string, unknown>, "Model") || "";
          return normalize(candMake).includes(wantMake) && normalize(candModel).includes(wantModel);
        });
        specs = pickRow ?? undefined;
      }
    }
  } catch {}

  return (
    <div className="space-y-6">
      <VehicleHeader vehicle={{ id: id, nickname: safe.display_name, year: safe.year ?? null, make: safe.make ?? null, model: safe.model ?? null, privacy: "PUBLIC" }} coverUrl={coverUrl} backHref="/vehicles" />
      <VehicleSpecSheet vehicle={{ id, nickname: safe.display_name, year: safe.year ?? null, make: safe.make ?? null, model: safe.model ?? null }} specs={specs} />
    </div>
  );
}
