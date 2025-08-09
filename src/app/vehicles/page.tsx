import Link from "next/link";
import PrivacyBadge from "@/components/PrivacyBadge";
import Image from "next/image";
import { getServerSupabase } from "@/lib/supabase";
import { createVehicle } from "./actions";
import UploadPhoto from "@/components/UploadPhoto";
import VehicleActions from "@/components/VehicleActions";
import { SummaryChipsSkeleton, SummaryChipsExtended } from "@/components/analytics/SummaryChips";
import ErrorBoundary from "@/components/ErrorBoundary";
// Note: Next 15 server components should use Promise-based searchParams; no headers()/window usage here.
import VehiclesJoinedToastClient from "./VehiclesJoinedToastClient";

export const dynamic = "force-dynamic";

type Role = "OWNER" | "MANAGER" | "CONTRIBUTOR" | "VIEWER";

export default async function VehiclesPage(
  props: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const reqId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`;
  if (process.env.NODE_ENV !== 'production') {
    // Server-only structured log: no PII
    console.log(JSON.stringify({ level: 'info', q: 'vehicles_page_load', reqId, actor: user?.id ?? null }));
  }
  type VehicleRow = {
    id: string;
    vin: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    nickname: string | null;
    privacy: "PUBLIC" | "PRIVATE";
    photo_url: string | null;
    garage_id: string;
  };

  const { data: vehicles } = await supabase
    .from("vehicle")
    .select("id, vin, year, make, model, trim, nickname, privacy, photo_url, garage_id")
    .order("created_at", { ascending: false });

  // Build role map for current user across listed vehicles' garages
  const roleByGarage = new Map<string, string>();
  if (user && vehicles && vehicles.length > 0) {
    const garageIds = Array.from(new Set((vehicles as VehicleRow[]).map(v => v.garage_id)));
    const { data: rolesData } = await supabase
      .from("garage_member")
      .select("garage_id, role")
      .in("garage_id", garageIds)
      .eq("user_id", user.id);
    (rolesData as Array<{ garage_id: string; role: string }> | null)?.forEach(r => {
      roleByGarage.set(r.garage_id, r.role);
    });
  }

  // Analytics v0 aggregates (batched; no N+1)
  const metrics = new Map<string, { upcoming: number; lastService: string | null; events30: number; daysSince: number | null; avgBetween: number | null }>();
  if (vehicles && vehicles.length > 0) {
    const vehicleIds = (vehicles as VehicleRow[]).map((v) => v.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    type WorkItemRow = { id: string; vehicle_id: string; status: "BACKLOG" | "PLANNED" | "IN_PROGRESS" | "DONE" | string };
    type ServiceEventRow = { vehicle_id: string; created_at: string; type: string };
    type RecentEventRow = { id: string; vehicle_id: string; created_at: string };

    const [workItemsRes, lastServicesRes, recentEventsRes] = await Promise.all([
      supabase
        .from("work_item")
        .select("id, vehicle_id, status")
        .in("vehicle_id", vehicleIds)
        .in("status", ["PLANNED", "IN_PROGRESS"]),
      supabase
        .from("event")
        .select("vehicle_id, created_at, type")
        .eq("type", "SERVICE")
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("event")
        .select("id, vehicle_id, created_at")
        .in("vehicle_id", vehicleIds)
        .gte("created_at", thirtyDaysAgo),
    ]);

    const upcomingByVehicle = new Map<string, number>();
    ((workItemsRes.data ?? []) as WorkItemRow[]).forEach((wi) => {
      upcomingByVehicle.set(wi.vehicle_id, (upcomingByVehicle.get(wi.vehicle_id) ?? 0) + 1);
    });

    const lastServiceByVehicle = new Map<string, string | null>();
    // Iterate in order (desc) and set first occurrence
    const serviceByVehicle: Record<string, string[]> = {};
    ((lastServicesRes.data ?? []) as ServiceEventRow[]).forEach((ev) => {
      if (!lastServiceByVehicle.has(ev.vehicle_id)) {
        lastServiceByVehicle.set(ev.vehicle_id, ev.created_at as string);
      }
      (serviceByVehicle[ev.vehicle_id] ??= []).push(ev.created_at);
    });

    const events30ByVehicle = new Map<string, number>();
    ((recentEventsRes.data ?? []) as RecentEventRow[]).forEach((ev) => {
      events30ByVehicle.set(ev.vehicle_id, (events30ByVehicle.get(ev.vehicle_id) ?? 0) + 1);
    });

    vehicleIds.forEach((id) => {
      // days since last
      const last = lastServiceByVehicle.get(id) ?? null;
      let daysSince: number | null = null;
      if (last) {
        const diffMs = Date.now() - new Date(last).getTime();
        daysSince = Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
      }
      // avg days between service over last 12 months
      let avgBetween: number | null = null;
      const svcDates = (serviceByVehicle[id] ?? []).slice(0, 365).map(d => new Date(d).getTime());
      if (svcDates.length >= 2) {
        // ensure desc order already; compute intervals between consecutive
        let total = 0;
        let count = 0;
        for (let i = 0; i < svcDates.length - 1; i++) {
          const a = svcDates[i];
          const b = svcDates[i + 1];
          const gapDays = Math.abs(Math.round((a - b) / (24 * 60 * 60 * 1000)));
          total += gapDays;
          count++;
        }
        if (count > 0) avgBetween = Math.round(total / count);
      }
      metrics.set(id, {
        upcoming: upcomingByVehicle.get(id) ?? 0,
        lastService: lastServiceByVehicle.get(id) ?? null,
        events30: events30ByVehicle.get(id) ?? 0,
        daysSince,
        avgBetween,
      });
    });
  }

  // Role filter
  const filterValues: Array<{ label: string; value: Role | "ALL" }> = [
    { label: "All", value: "ALL" },
    { label: "Owner", value: "OWNER" },
    { label: "Manager", value: "MANAGER" },
    { label: "Contributor", value: "CONTRIBUTOR" },
    { label: "Viewer", value: "VIEWER" },
  ];
  // Determine role filter and joined toast from Next 15 Promise-based searchParams
  const sp = await props.searchParams;
  const joined = sp?.joined === "1";
  const currentFilter: Role | "ALL" = (sp?.role as Role | undefined) ?? "ALL";

  return (
    <div className="space-y-8">
      <VehiclesJoinedToastClient />
      {joined && (
        <div role="status" aria-live="polite" className="sr-only">Joined garage.</div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Vehicles</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">Home</Link>
      </div>

      <div className="flex items-center gap-2 text-xs" role="tablist" aria-label="Filter by role">
        {filterValues.map(f => (
          <Link
            key={f.value}
            href={{ pathname: "/vehicles", query: f.value === "ALL" ? {} : { role: f.value } }}
            className={`px-2 py-1 rounded border ${currentFilter === f.value ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            role="tab"
            aria-selected={currentFilter === f.value}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {user ? (
        <form action={createVehicle} className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded p-4">
          <input name="vin" placeholder="VIN" className="border rounded px-2 py-1 md:col-span-2" />
          <input name="year" placeholder="Year" type="number" className="border rounded px-2 py-1" />
          <input name="make" placeholder="Make" className="border rounded px-2 py-1" required />
          <input name="model" placeholder="Model" className="border rounded px-2 py-1" required />
          <input name="trim" placeholder="Trim" className="border rounded px-2 py-1" />
          <input name="nickname" placeholder="Nickname" className="border rounded px-2 py-1 md:col-span-2" />
          <select name="privacy" className="border rounded px-2 py-1">
            <option value="PRIVATE">Private</option>
            <option value="PUBLIC">Public</option>
          </select>
          <button type="submit" className="bg-black text-white rounded px-3 py-1 md:col-span-2">Add Vehicle</button>
        </form>
      ) : (
        <p className="text-sm text-gray-600">Sign in to add and manage vehicles.</p>
      )}

      {(!vehicles || vehicles.length === 0) ? (
        <div className="flex flex-col items-center justify-center text-center border rounded p-12 bg-white text-gray-600">
          <div className="text-lg font-medium text-gray-800 mb-1">No vehicles yet</div>
          <div className="text-sm">Use the form above to add your first vehicle.</div>
        </div>
      ) : (
      <ErrorBoundary message="Failed to load vehicles.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.filter(v => {
          const role = roleByGarage.get((v as VehicleRow).garage_id) as Role | undefined;
          return currentFilter === "ALL" || role === currentFilter;
        }).map((v) => (
          <div key={v.id} className="border rounded overflow-hidden" data-test="vehicle-card">
            {v.photo_url ? (
              <Image src={v.photo_url} alt={v.nickname ?? `${v.year ?? ''} ${v.make} ${v.model}`} width={640} height={300} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">No photo</div>
            )}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Link href={`/vehicles/${v.id}`} className="font-medium hover:underline">{v.nickname ?? `${v.year ?? ''} ${v.make} ${v.model}`}</Link>
                <div className="flex items-center gap-3">
                  <PrivacyBadge value={v.privacy} />
                </div>
              </div>
              <div className="text-xs text-gray-600">{[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}</div>
              {metrics.size === 0 ? (
                <SummaryChipsSkeleton size="sm" />
              ) : (
                <SummaryChipsExtended
                  size="sm"
                  upcomingCount={metrics.get(v.id)?.upcoming ?? 0}
                  lastServiceDate={metrics.get(v.id)?.lastService ?? null}
                  events30Count={metrics.get(v.id)?.events30 ?? 0}
                  daysSinceLastService={metrics.get(v.id)?.daysSince ?? null}
                  avgDaysBetweenService={metrics.get(v.id)?.avgBetween ?? null}
                />
              )}
        <div className="flex items-center gap-3">
                <Link href={`/v/${v.id}`} className="text-blue-600 text-sm hover:underline">Public page</Link>
                <Link href={`/vehicles/${v.id}/tasks`} className="text-blue-600 text-sm hover:underline">Tasks</Link>
                <Link href={`/vehicles/${v.id}/timeline`} className="text-blue-600 text-sm hover:underline">Timeline</Link>
                <Link href={`/garage/${(v as VehicleRow).garage_id}/members`} className="text-blue-600 text-sm hover:underline">Members</Link>
                {user && <UploadPhoto vehicleId={v.id} />}
              </div>
              {user && (
                <div className="pt-2 border-t">
                  <VehicleActions
                    id={v.id}
                    initialNickname={v.nickname}
                    initialPrivacy={v.privacy}
                    initialVin={v.vin}
                    initialYear={v.year}
                    initialMake={v.make}
                    initialModel={v.model}
                    initialTrim={v.trim}
                    canWrite={(() => { const role = roleByGarage.get((v as VehicleRow).garage_id); return role === "OWNER" || role === "MANAGER" || role === "CONTRIBUTOR"; })()}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      </ErrorBoundary>
      )}
    </div>
  );
}
