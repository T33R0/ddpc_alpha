import { getServerSupabase } from "@/lib/supabase";
import VehicleFilter from "@/components/filters/VehicleFilter";
import { fetchTasks } from "@/lib/queries/tasks";
import { fetchAccessibleVehicles } from "@/lib/queries/vehicles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const sp = searchParams;
  const vehicleId = typeof sp.vehicleId === "string" ? sp.vehicleId : "";
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const vehicleOptions = await fetchAccessibleVehicles(supabase);

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <div className="flex items-center gap-4">
          <VehicleFilter options={vehicleOptions} />
          <span className="sr-only" aria-live="polite" data-testid="filter-announcer"></span>
        </div>
        <div className="rounded-2xl border bg-white p-6" role="status">
          <div className="text-gray-700">Pick a vehicle to view tasks.</div>
          <Link className="text-blue-600 hover:underline" href="/vehicles">Go to vehicles</Link>
        </div>
      </div>
    );
  }

  const { items } = await fetchTasks({ supabase, vehicleId: vehicleId || undefined, status, tag, limit: 20 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tasks</h1>
      <div className="flex items-center gap-4">
        <VehicleFilter options={vehicleOptions} />
        <span className="sr-only" aria-live="polite" data-testid="filter-announcer"></span>
      </div>
      <div data-testid="tasks-list" className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-gray-700">No tasks found.</div>
        ) : (
          items.map((t) => (
            <div key={t.id} className="rounded-2xl border bg-white p-4 flex justify-between">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-gray-500">{t.status}</div>
              </div>
              <div className="text-xs text-gray-600">{t.tag ?? ""}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
