import { getServerSupabase } from "@/lib/supabase";
import PrivacyBadge from "@/components/PrivacyBadge";
import TimelineClient from "./TimelineClient";

export const dynamic = "force-dynamic";

const TYPES = ["SERVICE","INSTALL","INSPECT","TUNE"] as const;

type Event = { id: string; type: typeof TYPES[number]; odometer: number | null; cost: number | null; notes: string | null; created_at: string };

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();
  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname, privacy")
    .eq("id", vehicleId)
    .maybeSingle();
  const { data: events } = await supabase
    .from("event")
    .select("id, type, odometer, cost, notes, created_at")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{vehicle?.nickname ?? `${vehicle?.year ?? ''} ${vehicle?.make ?? ''} ${vehicle?.model ?? ''}`}</h1>
          <PrivacyBadge value={vehicle?.privacy} />
        </div>
        <div className="flex items-center gap-3">
          {vehicle?.id && <a href={`/v/${vehicle.id}`} className="text-sm text-blue-600 hover:underline">Public page</a>}
          <a href="/vehicles" className="text-sm text-blue-600 hover:underline">Back to vehicles</a>
        </div>
      </div>

      <TimelineClient events={(events ?? []) as Event[]} vehicleId={vehicleId} />
    </div>
  );
}

