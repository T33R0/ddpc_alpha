import Link from "next/link";
import PrivacyBadge from "@/components/PrivacyBadge";
import Image from "next/image";
import { getServerSupabase } from "@/lib/supabase";
import { createVehicle } from "./actions";
import UploadPhoto from "@/components/UploadPhoto";
import VehicleActions from "@/components/VehicleActions";
import SummaryChips, { SummaryChipsSkeleton } from "@/components/analytics/SummaryChips";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  type VehicleRow = {
    id: string;
    vin: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    nickname: string | null;
    privacy: "PUBLIC" | "PRIVATE";
    photo_url: string | null;
  };

  const { data: vehicles } = await supabase
    .from("vehicle")
    .select("id, vin, year, make, model, trim, nickname, privacy, photo_url")
    .order("created_at", { ascending: false });

  // Analytics v0 aggregates (batched; no N+1)
  const metrics = new Map<string, { upcoming: number; lastService: string | null; events30: number }>();
  if (vehicles && vehicles.length > 0) {
    const vehicleIds = (vehicles as VehicleRow[]).map((v) => v.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    type WorkItemRow = { id: string; vehicle_id: string; status: "BACKLOG" | "PLANNED" | "IN_PROGRESS" | "DONE" | string };
    type ServiceEventRow = { vehicle_id: string; created_at: string; type: string };
    type RecentEventRow = { id: string; vehicle_id: string; created_at: string };

    const [workItemsRes, lastServicesRes, recentEventsRes] = await Promise.all([
      supabase
        .from("work_item")
        .select("id, vehicle_id, status")
        .in("vehicle_id", vehicleIds)
        .in("status", ["PLANNED", "IN_PROGRESS"]),
      supabase
        .from("event")
        .select("vehicle_id, created_at, type")
        .eq("type", "SERVICE")
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("event")
        .select("id, vehicle_id, created_at")
        .in("vehicle_id", vehicleIds)
        .gte("created_at", thirtyDaysAgo),
    ]);

    const upcomingByVehicle = new Map<string, number>();
    ((workItemsRes.data ?? []) as WorkItemRow[]).forEach((wi) => {
      upcomingByVehicle.set(wi.vehicle_id, (upcomingByVehicle.get(wi.vehicle_id) ?? 0) + 1);
    });

    const lastServiceByVehicle = new Map<string, string | null>();
    // Iterate in order (desc) and set first occurrence
    ((lastServicesRes.data ?? []) as ServiceEventRow[]).forEach((ev) => {
      if (!lastServiceByVehicle.has(ev.vehicle_id)) {
        lastServiceByVehicle.set(ev.vehicle_id, ev.created_at as string);
      }
    });

    const events30ByVehicle = new Map<string, number>();
    ((recentEventsRes.data ?? []) as RecentEventRow[]).forEach((ev) => {
      events30ByVehicle.set(ev.vehicle_id, (events30ByVehicle.get(ev.vehicle_id) ?? 0) + 1);
    });

    vehicleIds.forEach((id) => {
      metrics.set(id, {
        upcoming: upcomingByVehicle.get(id) ?? 0,
        lastService: lastServiceByVehicle.get(id) ?? null,
        events30: events30ByVehicle.get(id) ?? 0,
      });
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Vehicles</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">Home</Link>
      </div>

      {user ? (
        <form action={createVehicle} className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded p-4">
          <input name="vin" placeholder="VIN" className="border rounded px-2 py-1 md:col-span-2" />
          <input name="year" placeholder="Year" type="number" className="border rounded px-2 py-1" />
          <input name="make" placeholder="Make" className="border rounded px-2 py-1" required />
          <input name="model" placeholder="Model" className="border rounded px-2 py-1" required />
          <input name="trim" placeholder="Trim" className="border rounded px-2 py-1" />
          <input name="nickname" placeholder="Nickname" className="border rounded px-2 py-1 md:col-span-2" />
          <select name="privacy" className="border rounded px-2 py-1">
            <option value="PRIVATE">Private</option>
            <option value="PUBLIC">Public</option>
          </select>
          <button type="submit" className="bg-black text-white rounded px-3 py-1 md:col-span-2">Add Vehicle</button>
        </form>
      ) : (
        <p className="text-sm text-gray-600">Sign in to add and manage vehicles.</p>
      )}

      {(!vehicles || vehicles.length === 0) ? (
        <div className="flex flex-col items-center justify-center text-center border rounded p-12 bg-white text-gray-600">
          <div className="text-lg font-medium text-gray-800 mb-1">No vehicles yet</div>
          <div className="text-sm">Use the form above to add your first vehicle.</div>
        </div>
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <div key={v.id} className="border rounded overflow-hidden">
            {v.photo_url ? (
              <Image src={v.photo_url} alt={v.nickname ?? `${v.year ?? ''} ${v.make} ${v.model}`} width={640} height={300} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">No photo</div>
            )}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Link href={`/vehicles/${v.id}`} className="font-medium hover:underline">{v.nickname ?? `${v.year ?? ''} ${v.make} ${v.model}`}</Link>
                <div className="flex items-center gap-3">
                  <PrivacyBadge value={v.privacy} />
                </div>
              </div>
              <div className="text-xs text-gray-600">{[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}</div>
              {metrics.size === 0 ? (
                <SummaryChipsSkeleton size="sm" />
              ) : (
                <SummaryChips
                  size="sm"
                  upcomingCount={metrics.get(v.id)?.upcoming ?? 0}
                  lastServiceDate={metrics.get(v.id)?.lastService ?? null}
                  events30Count={metrics.get(v.id)?.events30 ?? 0}
                />
              )}
              <div className="flex items-center gap-3">
                <Link href={`/v/${v.id}`} className="text-blue-600 text-sm hover:underline">Public page</Link>
                <Link href={`/vehicles/${v.id}/tasks`} className="text-blue-600 text-sm hover:underline">Tasks</Link>
                <Link href={`/vehicles/${v.id}/timeline`} className="text-blue-600 text-sm hover:underline">Timeline</Link>
                {user && <UploadPhoto vehicleId={v.id} />}
              </div>
              {user && (
                <div className="pt-2 border-t">
                  <VehicleActions
                    id={v.id}
                    initialNickname={v.nickname}
                    initialPrivacy={v.privacy}
                    initialVin={v.vin}
                    initialYear={v.year}
                    initialMake={v.make}
                    initialModel={v.model}
                    initialTrim={v.trim}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
