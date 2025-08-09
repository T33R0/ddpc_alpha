import { getServerSupabase } from "@/lib/supabase";
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

      <TimelineClient events={(events ?? []) as Event[]} vehicleId={vehicleId} />
    </div>
  );
}

