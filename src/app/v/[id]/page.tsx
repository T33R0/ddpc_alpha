import { getServerSupabase } from "@/lib/supabase";
import Link from "next/link";
import { sanitizeVehicleForPublic } from "@/lib/public/sanitize";
import type { Metadata } from "next";
import VehicleHeader from "@/components/vehicle/VehicleHeader";
import VehicleQuickStats from "@/components/vehicle/VehicleQuickStats";
import VehicleTimelinePeek from "@/components/vehicle/VehicleTimelinePeek";
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

  // Quick stats for public: show event count; task information is not exposed on public page.
  const { count: eventCount } = await supabase.from("public_events").select("id", { head: true, count: "exact" }).eq("vehicle_id", id);

  return (
    <div className="space-y-6">
      <VehicleHeader vehicle={{ id: id, nickname: safe.display_name, year: safe.year ?? null, make: safe.make ?? null, model: safe.model ?? null, privacy: "PUBLIC" }} coverUrl={coverUrl} backHref="/vehicles" />
      <div className="grid md:grid-cols-3 gap-4">
        <VehicleQuickStats lastActivityISO={null} openTaskCount={0} doneTaskCount={0} eventCount={eventCount ?? 0} />
        {/* Public page: replace tasks peek with a minimal note */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 flex flex-col">
          <div className="text-base font-semibold mb-3">Tasks (private)</div>
          <div className="text-sm text-gray-600">Task details are private. Sign in to view.</div>
        </div>
        <VehicleTimelinePeek
          vehicleId={id}
          events={(safe.events ?? []).map((e, i) => ({ id: `public-${i}`, created_at: e.occurred_at, type: e.type ?? "SERVICE", notes: e.title }))}
        />
      </div>
    </div>
  );
}
