import { getServerSupabase } from "@/lib/supabase";
import { createEvent } from "./actions";
import TimelineClient from "./TimelineClient";

export const dynamic = "force-dynamic";

const TYPES = ["SERVICE","INSTALL","INSPECT","TUNE"] as const;

type Event = { id: string; type: typeof TYPES[number]; odometer: number | null; cost: number | null; notes: string | null; created_at: string };

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();
  const { data: events } = await supabase
    .from("event")
    .select("id, type, odometer, cost, notes, created_at")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Timeline</h1>

      <form action={createEvent.bind(null, vehicleId)} className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded p-4">
        <select name="type" className="border rounded px-2 py-1">
          {TYPES.map(t => (<option key={t} value={t}>{t}</option>))}
        </select>
        <input name="odometer" type="number" placeholder="Odometer" className="border rounded px-2 py-1" />
        <input name="cost" type="number" step="0.01" placeholder="Cost" className="border rounded px-2 py-1" />
        <input name="notes" placeholder="Notes" className="border rounded px-2 py-1 md:col-span-2" />
        <button type="submit" className="bg-black text-white rounded px-3 py-1">Add</button>
      </form>

      <TimelineClient events={(events ?? []) as Event[]} vehicleId={vehicleId} />
    </div>
  );
}

