import { getServerSupabase } from "@/lib/supabase";
import TimelineClient, { type TimelineEvent } from "@/app/vehicles/[id]/timeline/TimelineClient";
import { getEventTypes } from "@/lib/eventTypes";
import { fetchTimeline } from "@/lib/queries/timeline";

export const dynamic = "force-dynamic";

export default async function GlobalTimelinePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  // For now, show latest events across accessible vehicles (limit 50)
  const { items } = await fetchTimeline({ supabase, limit: 50 });
  const eventTypes = await getEventTypes();
  const mapType = (t: string): TimelineEvent["type"] => {
    switch (t) {
      case "SERVICE": return "SERVICE";
      case "INSTALL": return "MOD";
      case "INSPECT": return "NOTE";
      case "TUNE": return "DYNO";
      default: return "NOTE";
    }
  };
  const events: TimelineEvent[] = (items || []).map(i => ({
    id: i.id,
    vehicle_id: i.vehicle_id,
    type: mapType(i.type),
    title: i.title,
    notes: i.title,
    display_type: null,
    display_icon: null,
    display_color: null,
    display_label: null,
    occurred_at: i.occurred_at,
    occurred_on: i.occurred_at?.slice(0,10) ?? null,
    date_confidence: "exact",
    created_at: i.occurred_at,
    updated_at: i.occurred_at,
  } as TimelineEvent));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Timeline</h1>
      </div>
      <TimelineClient events={events} vehicleId={""} canWrite={!!user} eventTypes={eventTypes} />
    </div>
  );
}
