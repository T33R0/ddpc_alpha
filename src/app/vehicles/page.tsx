// import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";
import { DatabaseService } from "@/lib/api/database";
import { AnalyticsService } from "@/lib/api/analytics";
import { CachedAnalyticsService, globalCache } from "@/lib/api/cache";
// VehicleCard is rendered client-side via VehiclesListClient
import VehiclesListClient from "@/components/vehicles/VehiclesListClient";
import ErrorBoundary from "@/components/ErrorBoundary";

// Compatible with Next 14/15; see searchParams handling below.
import VehiclesJoinedToastClient from "./VehiclesJoinedToastClient";
import AddVehicleModalClient from "./AddVehicleModalClient";

export const dynamic = "force-dynamic";

  // type Role = "OWNER" | "MANAGER" | "CONTRIBUTOR" | "VIEWER";

export default async function VehiclesPage(
  props: { searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>> }
) {
  // Small local promise guard to support Next 14/15 differences
  function isPromise<T>(v: unknown): v is Promise<T> {
    return !!v && (typeof v === "object" || typeof v === "function") && "then" in (v as object);
  }

  try {
  // Defaults to keep render resilient if Supabase/env fails
  let supabase: Awaited<ReturnType<typeof getServerSupabase>> | null = null;
  let user: { id: string } | null = null;
  const reqId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
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
      let baseQuery = supabase
        .from("vehicle")
        .select("id, vin, year, make, model, trim, nickname, privacy, photo_url, garage_id, created_at");
      if (query) {
        baseQuery = baseQuery.ilike("nickname", '%' + query + '%');
      }

      let data: unknown | null = null;
      let error: { message: string } | null = null;

      if (user && userGarageIds.length > 0) {
        // Prefer filtered by memberships; if it yields 0, fall back to unfiltered to avoid empty UI due to SSR/RLS edge cases
        const filtered = await baseQuery.in("garage_id", userGarageIds).order("created_at", { ascending: false });
        if (!filtered.error && (filtered.data as unknown[] | null)?.length) {
          data = filtered.data;
        } else {
          const unf = await baseQuery.order("created_at", { ascending: false });
          error = unf.error as { message: string } | null;
          data = unf.data;
        }
      } else {
        const unf = await baseQuery.order("created_at", { ascending: false });
        error = unf.error as { message: string } | null;
        data = unf.data;
      }

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

  // Optimized Analytics v2 (single query, no N+1)
  const metrics = new Map<string, { upcoming: number; lastService: string | null; events30: number; daysSince: number | null; avgBetween: number | null }>();
  const lastEventByVehicle = new Map<string, string | null>();

  if (vehicleRows && vehicleRows.length > 0 && supabase) {
    const vehicleIds = vehicleRows.map((v) => v.id);

    // Use cached analytics service for optimal performance
    const db = new DatabaseService(supabase);
    const analyticsService = new AnalyticsService(db);
    const cachedAnalytics = new CachedAnalyticsService(analyticsService, globalCache);
    const analyticsMap = await cachedAnalytics.getVehicleAnalytics(vehicleIds);

    // Convert to the expected format for compatibility
    vehicleIds.forEach((vehicleId) => {
      const analytics = analyticsMap.get(vehicleId);
      if (analytics) {
        metrics.set(vehicleId, {
          upcoming: analytics.upcoming_tasks,
          lastService: analytics.last_service_date,
          events30: analytics.events_30_days,
          daysSince: analytics.days_since_last_service,
          avgBetween: analytics.avg_days_between_services,
        });
        lastEventByVehicle.set(vehicleId, analytics.last_event_date);
      } else {
        // Fallback for vehicles with no analytics data
        metrics.set(vehicleId, {
          upcoming: 0,
          lastService: null,
          events30: 0,
          daysSince: null,
          avgBetween: null,
        });
        lastEventByVehicle.set(vehicleId, null);
      }
    });
  }

  // Filters already derived above: joined, currentFilter, query, sortBy

  // Build plain objects for client props to avoid complex generics inline in JSX
  const vehiclesList = (vehicleRows ?? []).map((v) => ({
    id: v.id,
    name: v.nickname ?? [v.year ?? '', v.make ?? '', v.model ?? ''].filter(Boolean).join(' '),
    year: v.year ?? null,
    make: v.make ?? null,
    model: v.model ?? null,
    is_public: (v.privacy as string | null) === "PUBLIC",
    updated_at: v.updated_at ?? null,
    created_at: v.created_at ?? null,
    last_event_at: lastEventByVehicle.get(v.id) ?? null,
    photo_url: v.photo_url ?? null,
    garage_id: v.garage_id,
  }));

  type MetricsShape = { upcoming: number; lastService: string | null; daysSince: number | null; avgBetween: number | null };
  const metricsObj: Record<string, MetricsShape> = (vehicleRows ?? []).reduce((acc, v) => {
    acc[v.id] = metrics.get(v.id) ?? { upcoming: 0, lastService: null, daysSince: null, avgBetween: null };
    return acc;
  }, {} as Record<string, MetricsShape>);

  return (
    <div className="space-y-6">
      <VehiclesJoinedToastClient />
      {joined && (
        <div role="status" aria-live="polite" className="sr-only">Joined garage.</div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="h1-my-garage">Garage</h1>
        <AddVehicleModalClient isAuthenticated={!!user} />
      </div>

      {!user && (
        <p className="text-sm text-gray-600">Sign in to add and manage vehicles.</p>
      )}

      <ErrorBoundary message="Failed to load vehicles.">
        <VehiclesListClient vehicles={vehiclesList} metrics={metricsObj} />
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
