import Link from "next/link";
import EventList from "@/components/timeline/EventList";

type PeekEvent = {
  id: string;
  type: string | null;
  title: string | null;
  description: string | null;
  occurred_at: string | null;
  occurred_on: string | null;
  date_confidence?: "exact" | "approximate" | "unknown";
  icon?: string | null;
  color?: string | null;
  label?: string | null;
};

export default function VehicleTimelinePeek({ vehicleId, events }: { vehicleId: string; events: PeekEvent[] }) {
  const list = events.slice(0, 3);
  return (
    <div className="rounded-2xl border bg-card text-fg shadow-sm p-5 flex flex-col">
      <div className="text-base font-semibold mb-3">Recent events</div>
      {list.length === 0 ? (
        <div className="text-sm text-muted">No events yet.</div>
      ) : (
        <div className="-mx-2">
          <EventList events={list} />
        </div>
      )}
      <div className="mt-3 text-xs"><Link href={`/vehicles/${vehicleId}/timeline`} className="text-[color:var(--brand)] hover:underline">View timeline</Link></div>
    </div>
  );
}


