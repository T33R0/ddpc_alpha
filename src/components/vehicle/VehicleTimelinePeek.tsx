import Link from "next/link";

type Event = { id: string; created_at: string; type: string; notes: string | null };

export default function VehicleTimelinePeek({ vehicleId, events }: { vehicleId: string; events: Event[] }) {
  return (
    <div className="rounded-2xl border bg-card text-fg shadow-sm p-5 flex flex-col">
      <div className="text-base font-semibold mb-3">Recent events</div>
      {events.length === 0 ? (
        <div className="text-sm text-muted">No events yet.</div>
      ) : (
        <ul className="divide-y">
          {events.slice(0, 3).map((e) => (
            <li key={e.id} className="py-2 flex items-center justify-between">
              <div className="text-sm text-fg">{e.notes ?? e.type}</div>
              <div className="text-xs text-muted">{new Date(e.created_at).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 text-xs"><Link href={`/vehicles/${vehicleId}/timeline`} className="text-[color:var(--brand)] hover:underline">View timeline</Link></div>
    </div>
  );
}


