import Link from "next/link";
import Image from "next/image";
import PrivacyBadge from "@/components/PrivacyBadge";
import { getServerSupabase } from "@/lib/supabase";
import SummaryChips from "@/components/analytics/SummaryChips";

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

  const vehicleIds = [vehicleId];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
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

  const upcoming = (workItemsRes.data ?? []).length;
  const lastService = (lastServicesRes.data ?? []).find((e: any) => e.vehicle_id === vehicleId)?.created_at ?? null;
  const events30 = (recentEventsRes.data ?? []).length;

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
        <SummaryChips upcomingCount={upcoming} lastServiceDate={lastService} events30Count={events30} size="md" />
      </div>
    </div>
  );
}


