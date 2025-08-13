import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";
import VehicleHeader from "@/components/vehicle/VehicleHeader";
// Slides are rendered inside a local carousel component
import VehicleOverviewCarousel from "@/components/vehicle/VehicleOverviewCarousel";
import { getVehicleCoverUrl } from "@/lib/getVehicleCoverUrl";
import DeleteVehicleButtonClient from "./DeleteVehicleButtonClient";
// Editing UI is no longer shown on the details landing; users can access it from a dedicated page later

export const dynamic = "force-dynamic";

export default async function VehicleOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();

  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, vin, year, make, model, trim, nickname, privacy, garage_id, photo_url")
    .eq("id", vehicleId)
    .maybeSingle();

  // Fetch prev/next vehicles in same garage by created_at order
  let prevId: string | null = null;
  let nextId: string | null = null;
  if (vehicle?.garage_id) {
    const { data: siblings } = await supabase
      .from("vehicle")
      .select("id")
      .eq("garage_id", vehicle.garage_id as string)
      .order("created_at", { ascending: false });
    const ids = (siblings ?? []).map((r: { id: string }) => r.id);
    const idx = ids.indexOf(vehicleId);
    if (idx !== -1) {
      prevId = ids[idx + 1] ?? null;
      nextId = ids[idx - 1] ?? null;
    }
  }

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

      {/* Inject prev/next links into arrows */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(() => {
            const prev = ${JSON.stringify(prevId)};
            const next = ${JSON.stringify(nextId)};
            const root = document.currentScript?.parentElement;
            if (!root) return;
            const prevA = root.querySelector('a[data-testid="veh-prev"]');
            const nextA = root.querySelector('a[data-testid="veh-next"]');
            if (prevA) {
              if (prev) { prevA.setAttribute('href', '/vehicles/' + prev); prevA.removeAttribute('aria-disabled'); }
              else { prevA.setAttribute('aria-disabled', 'true'); prevA.classList.add('opacity-40','cursor-not-allowed'); }
            }
            if (nextA) {
              if (next) { nextA.setAttribute('href', '/vehicles/' + next); nextA.removeAttribute('aria-disabled'); }
              else { nextA.setAttribute('aria-disabled', 'true'); nextA.classList.add('opacity-40','cursor-not-allowed'); }
            }
          })();`,
        }}
      />

      {/* Carousel: Overview and Official performance */}
      <VehicleOverviewCarousel
        vehicle={{ id: vehicle.id as string, nickname: vehicle.nickname, year: vehicle.year, make: vehicle.make, model: vehicle.model }}
        quickStats={{ lastActivityISO, openTaskCount: openCount, doneTaskCount: doneCount, eventCount: recentEventsRes.count ?? 0 }}
        tasks={tasksPeek}
        events={eventsPeek}
      />

      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          <Link href={`/vehicles/${vehicleId}/plans`} className="text-sm px-3 py-1 rounded border" data-testid="nav-build-plans">Build Plans</Link>
          <DeleteVehicleButtonClient vehicleId={vehicleId} />
        </div>
      </div>
    </div>
  );
}


