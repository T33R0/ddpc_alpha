import { getServerSupabase } from "@/lib/supabase";
import PrivacyBadge from "@/components/PrivacyBadge";
import TimelineClient from "./TimelineClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";
import VehicleFilter from "@/components/filters/VehicleFilter";
import { fetchAccessibleVehicles } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";

type EventType = "SERVICE" | "INSTALL" | "INSPECT" | "TUNE";
type Event = { id: string; type: EventType; odometer: number | null; cost: number | null; notes: string | null; created_at: string };

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const reqId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`;
  if (process.env.NODE_ENV !== 'production') {
    console.log(JSON.stringify({ level: 'info', q: 'timeline_page_load', reqId, actor: user?.id ?? null, vehicleId }));
  }
  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname, privacy, garage_id")
    .eq("id", vehicleId)
    .maybeSingle();
  // Determine whether to show exports: PUBLIC/UNLISTED or user is a member (any role)
  let canExport = false;
  if (vehicle?.privacy === "PUBLIC" || vehicle?.privacy === "UNLISTED") {
    canExport = true;
  } else if (user && vehicle?.garage_id) {
    const { data: membership } = await supabase
      .from("garage_member")
      .select("id")
      .eq("garage_id", vehicle.garage_id as string)
      .eq("user_id", user.id)
      .maybeSingle();
    canExport = !!membership;
  }
  const { data: events } = await supabase
    .from("event")
    .select("id, type, odometer, cost, notes, created_at")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  // Determine role for UI gating (VIEWER => read-only; CONTRIBUTOR+ => write)
  let canWrite = false;
  if (user && vehicle?.garage_id) {
    const { data: m } = await supabase
      .from("garage_member")
      .select("role")
      .eq("garage_id", vehicle.garage_id as string)
      .eq("user_id", user.id)
      .maybeSingle();
    const role = (m?.role as string) ?? null;
    canWrite = role === "OWNER" || role === "MANAGER" || role === "CONTRIBUTOR";
  }

  const vehicleOptions = await fetchAccessibleVehicles(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{vehicle?.nickname ?? `${vehicle?.year ?? ''} ${vehicle?.make ?? ''} ${vehicle?.model ?? ''}`}</h1>
          <PrivacyBadge value={vehicle?.privacy} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            {canExport && (
              <>
                <Link href={`/api/vehicles/${vehicleId}/events.csv`} className="text-sm text-gray-700 border rounded px-2 py-1 bg-white hover:bg-gray-50">Export CSV</Link>
                <Link href={`/api/vehicles/${vehicleId}/calendar.ics`} className="text-sm text-gray-700 border rounded px-2 py-1 bg-white hover:bg-gray-50">Download ICS</Link>
              </>
            )}
            <Link href="/vehicles" className="text-sm text-blue-600 hover:underline">Back to vehicles</Link>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <VehicleFilter options={vehicleOptions} mode="scoped" currentId={vehicleId} targetSubroute="timeline" />
        <span className="sr-only" aria-live="polite" data-testid="filter-announcer"></span>
      </div>

      <p className="text-sm text-gray-700 border rounded p-3 bg-white" data-test="timeline-helper-copy">
        Events are immutable after 24h. Events with a ‘from task’ badge were logged at task completion.
      </p>

      <ErrorBoundary message="Failed to load timeline.">
        <TimelineClient events={(events ?? []) as Event[]} vehicleId={vehicleId} canWrite={canWrite} />
      </ErrorBoundary>
    </div>
  );
}

