import Link from "next/link";
import Image from "next/image";
import PrivacyBadge from "@/components/PrivacyBadge";
import { getServerSupabase } from "@/lib/supabase";
import { SummaryChipsExtended } from "@/components/analytics/SummaryChips";

export const dynamic = "force-dynamic";

export default async function VehicleOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();

  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, vin, year, make, model, trim, nickname, privacy, photo_url")
    .eq("id", vehicleId)
    .maybeSingle();

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Vehicle</h1>
          <Link href="/vehicles" className="text-sm text-blue-600 hover:underline">Back</Link>
        </div>
        <div className="text-gray-600">Not found.</div>
      </div>
    );
  }

  const vehicleIds: string[] = [vehicleId];
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

  const serviceEvents = ((lastServicesRes.data ?? []) as ServiceEventRow[]).filter(e => e.vehicle_id === vehicleId);
  const upcoming = ((workItemsRes.data ?? []) as WorkItemRow[]).length;
  const lastService = serviceEvents[0]?.created_at ?? null;
  const events30 = ((recentEventsRes.data ?? []) as RecentEventRow[]).length;
  let daysSince: number | null = null;
  if (lastService) {
    const diffMs = Date.now() - new Date(lastService).getTime();
    daysSince = Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
  }
  let avgBetween: number | null = null;
  if (serviceEvents.length >= 2) {
    let total = 0;
    let count = 0;
    for (let i = 0; i < serviceEvents.length - 1; i++) {
      const a = new Date(serviceEvents[i].created_at).getTime();
      const b = new Date(serviceEvents[i + 1].created_at).getTime();
      const gap = Math.abs(Math.round((a - b) / (24 * 60 * 60 * 1000)));
      total += gap;
      count++;
    }
    if (count > 0) avgBetween = Math.round(total / count);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{vehicle.nickname ?? `${vehicle.year ?? ''} ${vehicle.make} ${vehicle.model}`}</h1>
          <PrivacyBadge value={vehicle.privacy} />
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/v/${vehicle.id}`} className="text-sm text-blue-600 hover:underline">Public page</Link>
          <Link href={`/vehicles/${vehicle.id}/tasks`} className="text-sm text-blue-600 hover:underline">Tasks</Link>
          <Link href={`/vehicles/${vehicle.id}/timeline`} className="text-sm text-blue-600 hover:underline">Timeline</Link>
          <Link href="/vehicles" className="text-sm text-blue-600 hover:underline">Back to vehicles</Link>
        </div>
      </div>

      {vehicle.photo_url ? (
        <Image src={vehicle.photo_url} alt={vehicle.nickname ?? `${vehicle.year ?? ''} ${vehicle.make} ${vehicle.model}`} width={1280} height={720} className="w-full h-auto max-h-[420px] object-cover rounded" />
      ) : (
        <div className="w-full h-60 bg-gray-100 rounded flex items-center justify-center text-gray-400">No photo</div>
      )}

      <div>
        <SummaryChipsExtended
          upcomingCount={upcoming}
          lastServiceDate={lastService}
          events30Count={events30}
          daysSinceLastService={daysSince}
          avgDaysBetweenService={avgBetween}
          size="md"
        />
      </div>
    </div>
  );
}


