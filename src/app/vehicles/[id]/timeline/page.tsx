import { getServerSupabase } from "@/lib/supabase";
import PrivacyBadge from "@/components/PrivacyBadge";
import TimelineClient from "./TimelineClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";

export const dynamic = "force-dynamic";

type EventType = "SERVICE" | "INSTALL" | "INSPECT" | "TUNE";
type Event = { id: string; type: EventType; odometer: number | null; cost: number | null; notes: string | null; created_at: string };

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
          {vehicle?.id && <Link href={`/v/${vehicle.id}`} className="text-sm text-blue-600 hover:underline">Public page</Link>}
          <div className="flex items-center gap-3">
            <Link href={`/api/vehicles/${vehicleId}/events.csv`} className="text-sm text-gray-700 border rounded px-2 py-1 bg-white hover:bg-gray-50">Export CSV</Link>
            <Link href="/vehicles" className="text-sm text-blue-600 hover:underline">Back to vehicles</Link>
          </div>
        </div>
      </div>

      <ErrorBoundary message="Failed to load timeline.">
        <TimelineClient events={(events ?? []) as Event[]} vehicleId={vehicleId} />
      </ErrorBoundary>
    </div>
  );
}

