import { getServerSupabase } from "@/lib/supabase";
import VehicleFilter from "@/components/filters/VehicleFilter";
import { fetchTimeline } from "@/lib/queries/timeline";
import { fetchAccessibleVehicles } from "@/lib/queries/vehicles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TimelinePage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const sp = searchParams;
  const vehicleId = typeof sp.vehicleId === "string" ? sp.vehicleId : "";
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const vehicleOptions = await fetchAccessibleVehicles(supabase);

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Timeline</h1>
        <div className="flex items-center gap-4">
          <VehicleFilter options={vehicleOptions} />
          <span className="sr-only" aria-live="polite" data-testid="filter-announcer"></span>
        </div>
        <div className="rounded-2xl border bg-white p-6" role="status">
          <div className="text-gray-700">Pick a vehicle to view timeline.</div>
          <Link className="text-blue-600 hover:underline" href="/vehicles">Go to vehicles</Link>
        </div>
      </div>
    );
  }

  const { items } = await fetchTimeline({ supabase, vehicleId: vehicleId || undefined, limit: 20 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Timeline</h1>
      <div className="flex items-center gap-4">
        <VehicleFilter options={vehicleOptions} />
        <span className="sr-only" aria-live="polite" data-testid="filter-announcer"></span>
      </div>
      <div data-testid="timeline-list" className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-gray-700">No events found.</div>
        ) : (
          items.map((e) => (
            <div key={e.id} className="rounded-2xl border bg-white p-4 flex justify-between">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-gray-500">{new Date(e.occurred_at).toLocaleString()}</div>
              </div>
              <div className="text-xs text-gray-600">{e.type}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
