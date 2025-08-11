import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";
import VehicleHeader from "@/components/vehicle/VehicleHeader";
import VehicleQuickStats from "@/components/vehicle/VehicleQuickStats";
import VehicleTasksPeek from "@/components/vehicle/VehicleTasksPeek";
import VehicleTimelinePeek from "@/components/vehicle/VehicleTimelinePeek";
import { getVehicleCoverUrl } from "@/lib/getVehicleCoverUrl";
import DeleteVehicleButtonClient from "./DeleteVehicleButtonClient";

export const dynamic = "force-dynamic";

export default async function VehicleOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();

  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, vin, year, make, model, trim, nickname, privacy, garage_id, photo_url")
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

  // Quick stats and snapshots (cheap queries)
  // Counts
  const [openTasksRes, doneTasksRes, recentEventsRes, tasksPeekRes, eventsPeekRes] = await Promise.all([
    supabase.from("work_item").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicleId).in("status", ["PLANNED", "IN_PROGRESS"]),
    supabase.from("work_item").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicleId).eq("status", "DONE"),
    supabase.from("event").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicleId),
    supabase.from("work_item").select("id, title, due, tags").eq("vehicle_id", vehicleId).in("status", ["PLANNED", "IN_PROGRESS"]).order("created_at", { ascending: true }).limit(3),
    supabase.from("event").select("id, created_at, type, notes").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }).limit(3),
  ]);

  const openCount = openTasksRes.count ?? 0;
  const doneCount = doneTasksRes.count ?? 0;
  const eventCount = recentEventsRes.count ?? 0;
  const tasksPeek = (tasksPeekRes.data ?? []) as { id: string; title: string; due: string | null; tags: string[] | null }[];
  const eventsPeek = (eventsPeekRes.data ?? []) as { id: string; created_at: string; type: string; notes: string | null }[];

  // Last activity: most recent of event or done task
  let lastActivityISO: string | null = null;
  {
    const [lastEventRes, lastDoneTaskRes] = await Promise.all([
      supabase.from("event").select("created_at").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("work_item").select("updated_at").eq("vehicle_id", vehicleId).eq("status", "DONE").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const lastEvent = (lastEventRes.data as { created_at?: string } | null)?.created_at ?? null;
    const lastDone = (lastDoneTaskRes.data as { updated_at?: string } | null)?.updated_at ?? null;
    lastActivityISO = [lastEvent, lastDone].filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] ?? null;
  }

  const coverUrl = await getVehicleCoverUrl(supabase, vehicleId, (vehicle as { photo_url?: string | null } | null)?.photo_url ?? null);

  return (
    <div className="space-y-6">
      <VehicleHeader vehicle={{ id: vehicle.id as string, nickname: vehicle.nickname, year: vehicle.year, make: vehicle.make, model: vehicle.model, privacy: vehicle.privacy }} coverUrl={coverUrl} showPublicLink={true} />

      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          <Link href={`/vehicles/${vehicleId}/plans`} className="text-sm px-3 py-1 rounded border" data-testid="nav-build-plans">Build Plans</Link>
          <DeleteVehicleButtonClient vehicleId={vehicleId} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <VehicleQuickStats lastActivityISO={lastActivityISO} openTaskCount={openCount} doneTaskCount={doneCount} eventCount={eventCount} />
        <VehicleTasksPeek vehicleId={vehicleId} tasks={tasksPeek} />
        <VehicleTimelinePeek vehicleId={vehicleId} events={eventsPeek} />
      </div>
    </div>
  );
}


