// import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";
// VehicleCard is rendered client-side via VehiclesListClient
import VehiclesListClient from "@/components/vehicles/VehiclesListClient";
import ErrorBoundary from "@/components/ErrorBoundary";

// Compatible with Next 14/15; see searchParams handling below.
import VehiclesJoinedToastClient from "./VehiclesJoinedToastClient";
import VehiclesFiltersClient from "./VehiclesFiltersClient";
import AddVehicleModalClient from "./AddVehicleModalClient";

export const dynamic = "force-dynamic";

  // type Role = "OWNER" | "MANAGER" | "CONTRIBUTOR" | "VIEWER";

export default async function VehiclesPage(
  props: { searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>> }
) {
  // Small local promise guard to support Next 14/15 differences
  const isPromise = <T,>(v: unknown): v is Promise<T> => !!v && (typeof v === "object" || typeof v === "function") && "then" in (v as object);

  try {
  // Defaults to keep render resilient if Supabase/env fails
  let supabase: Awaited<ReturnType<typeof getServerSupabase>> | null = null;
  let user: { id: string } | null = null;
  const reqId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`;
  try {
    supabase = await getServerSupabase();
    const auth = await supabase.auth.getUser();
    user = auth.data.user as { id: string } | null;
    if (process.env.NODE_ENV !== 'production') {
      // Server-only structured log: no PII
      console.log(JSON.stringify({ level: 'info', q: 'vehicles_page_load', reqId, actor: user?.id ?? null }));
    }
  } catch (e) {
    // Log server-side; avoid crashing SSR
    console.error("vehicles_page_init_error", { reqId, err: e instanceof Error ? e.message : String(e) });
  }

  // Derive filters; support both object (Next 14) and Promise (Next 15)
  const spMaybe = props.searchParams;
  const sp = isPromise<Record<string, string | string[] | undefined>>(spMaybe) ? await spMaybe : (spMaybe ?? {});
  const joined = sp?.joined === "1";
  // const currentFilter: Role | "ALL" = (sp?.role as Role | undefined) ?? "ALL";
  const query = (sp?.q as string | undefined)?.trim() ?? "";
  // const sortBy = ((sp?.sort as string | undefined) === "name" ? "name" : "updated") as "updated" | "name";
  // Note: Client shape for VehiclesListClient is constructed directly below; no local alias needed.
  // Use a typed shape matching our select for strong typing without any-casts
  type VehicleSelect = {
    id: string;
    vin: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    nickname: string | null;
    privacy: "PUBLIC" | "PRIVATE" | string;
    photo_url: string | null;
    garage_id: string;
    created_at: string | null;
    updated_at: string | null;
  };

  // Prefetch user garage ids to aid debugging and optionally pre-filter
  const userGarageIds: string[] = [];
  if (supabase && user) {
    try {
      const { data: gm } = await supabase
        .from("garage_member")
        .select("garage_id")
        .eq("user_id", user.id);
      (gm as Array<{ garage_id: string }> | null)?.forEach(r => userGarageIds.push(r.garage_id));
      if (process.env.NODE_ENV !== 'production') {
        console.log(JSON.stringify({ level: 'info', q: 'vehicles_user_garages', reqId, count: userGarageIds.length }));
      }
    } catch (e) {
      console.error("vehicles_user_garages_error", { reqId, err: e instanceof Error ? e.message : String(e) });
    }
  }

  let vehicleRows: VehicleSelect[] | null = null;
  if (supabase) {
    try {
      let vehiclesQuery = supabase
        .from("vehicle")
        .select("id, vin, year, make, model, trim, nickname, privacy, photo_url, garage_id, created_at");
      if (query) {
        vehiclesQuery = vehiclesQuery.ilike("nickname", `%${query}%`);
      }
      if (userGarageIds.length > 0) {
        vehiclesQuery = vehiclesQuery.in("garage_id", userGarageIds);
      }
      const { data, error } = await vehiclesQuery.order("created_at", { ascending: false });
      if (error) {
        console.error("vehicles_query_error", { reqId, error: error.message });
      }
      vehicleRows = (data as unknown as VehicleSelect[]) ?? null;
      if (process.env.NODE_ENV !== 'production') {
        console.log(JSON.stringify({ level: 'info', q: 'vehicles_query_result', reqId, count: vehicleRows?.length ?? 0 }));
      }
    } catch (e) {
      console.error("vehicles_query_throw", { reqId, err: e instanceof Error ? e.message : String(e) });
    }
  }

  // Build role map for current user across listed vehicles' garages
  const roleByGarage = new Map<string, string>();
  if (user && vehicleRows && vehicleRows.length > 0 && supabase) {
    const garageIds = Array.from(new Set(vehicleRows.map(v => v.garage_id)));
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
  if (vehicleRows && vehicleRows.length > 0 && supabase) {
    const vehicleIds = vehicleRows.map((v) => v.id);
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

  // Filters already derived above: joined, currentFilter, query, sortBy

  return (
    <div className="space-y-6">
      <VehiclesJoinedToastClient />
      {joined && (
        <div role="status" aria-live="polite" className="sr-only">Joined garage.</div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="h1-my-garage">Garage</h1>
        <AddVehicleModalClient />
      </div>

      <div className="sticky top-0 z-10 -mx-3 px-3 bg-bg/80 backdrop-blur border-b">
        <div className="py-3">
          <VehiclesFiltersClient />
        </div>
      </div>

      {user ? (
        <div className="text-sm text-gray-600">Use the New Vehicle button to add a vehicle.</div>
      ) : (
        <p className="text-sm text-gray-600">Sign in to add and manage vehicles.</p>
      )}

      <ErrorBoundary message="Failed to load vehicles.">
        <VehiclesListClient
          vehicles={(vehicleRows ?? []).map((v) => ({
            id: v.id,
            name: v.nickname ?? `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`,
            year: v.year ?? null,
            make: v.make ?? null,
            model: v.model ?? null,
            is_public: (v.privacy as string | null) === "PUBLIC",
            updated_at: v.updated_at ?? null,
            created_at: v.created_at ?? null,
            last_event_at: null,
            photo_url: v.photo_url ?? null,
            garage_id: v.garage_id,
          }))}
          metrics={(vehicleRows ?? []).reduce<Record<string, { upcoming: number; lastService: string | null; daysSince: number | null; avgBetween: number | null }>>((acc, v) => {
            acc[v.id] = metrics.get(v.id) ?? { upcoming: 0, lastService: null, daysSince: null, avgBetween: null };
            return acc;
          }, {})}
        />
      </ErrorBoundary>
    </div>
  );
  } catch (e) {
    // Final safety net: never crash SSR; render minimal fallback
    console.error("vehicles_page_fatal", { err: e instanceof Error ? e.message : String(e) });
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">My Garage</h1>
        <div className="border rounded bg-red-50 text-red-700 text-sm p-3">Failed to load vehicles.</div>
      </div>
    );
  }
}
