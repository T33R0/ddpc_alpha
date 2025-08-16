import { getServerSupabase } from "@/lib/supabase";
import PrivacyBadge from "@/components/PrivacyBadge";
import TimelineClient, { type TimelineEvent } from "./TimelineClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";
import { getEventTypes } from "@/lib/eventTypes";
// Removed vehicle filter on timeline per UX update

export const dynamic = "force-dynamic";

type EventType = "SERVICE" | "INSTALL" | "INSPECT" | "TUNE";

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
    .select("id, type, odometer, cost, title, notes, occurred_at, occurred_on, date_confidence, manual_type_key, created_at, updated_at")
    .eq("vehicle_id", vehicleId)
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Adapt legacy Event rows to TimelineEvent shape expected by TimelineClient
  const mapType = (t: EventType): TimelineEvent["type"] => {
    switch (t) {
      case "SERVICE":
        return "SERVICE";
      case "INSTALL":
        return "MOD";
      case "INSPECT":
        return "NOTE";
      case "TUNE":
        return "DYNO";
      default:
        return "NOTE";
    }
  };
  // fetch event types for client modal form (and to map labels/icons on existing rows)
  const eventTypes = await getEventTypes();
  const typeMeta = new Map<string, { label: string; icon: string; color: string }>();
  for (const t of eventTypes) typeMeta.set(t.key, { label: t.label, icon: t.icon, color: t.color });

  const timelineEvents: TimelineEvent[] = (events ?? []).map((e) => {
    const manualKey = (e as { manual_type_key?: string | null }).manual_type_key ?? null;
    const meta = manualKey ? typeMeta.get(manualKey) ?? null : null;
    const cleanedNotes = (e as { notes?: string | null }).notes ?? null;
    return {
      id: e.id,
      vehicle_id: vehicleId,
      type: mapType(e.type),
      title: (e as { title?: string | null }).title ?? null,
      notes: cleanedNotes,
      display_type: manualKey,
      display_icon: meta?.icon ?? null,
      display_color: meta?.color ?? null,
      display_label: meta?.label ?? null,
      occurred_at: (e as { occurred_at?: string | null }).occurred_at ?? e.created_at,
      occurred_on: (e as { occurred_on?: string | null }).occurred_on ?? (e.created_at ? (e.created_at as string).slice(0, 10) : null),
      date_confidence: (e as { date_confidence?: string | null }).date_confidence as "exact"|"approximate"|"unknown" ?? "exact",
      created_at: e.created_at,
      updated_at: (e as { updated_at?: string | null }).updated_at ?? null,
    } as TimelineEvent;
  });

  // Determine role for UI gating (VIEWER => read-only; CONTRIBUTOR+ => write)
  // For this stage: assume everyone is an owner; allow editing/adding
  const canWrite = true;

  // no vehicle switcher here

  // eventTypes already fetched above; pass through for the create modal

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

      {/* Vehicle switcher removed on timeline page */}

      {/* Helper copy removed per new editing policy */}

      <ErrorBoundary message="Failed to load timeline.">
        <TimelineClient events={timelineEvents} vehicleId={vehicleId} canWrite={canWrite} eventTypes={eventTypes} />
      </ErrorBoundary>
    </div>
  );
}

