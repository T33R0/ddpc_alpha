import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";
import VehicleHeader from "@/components/vehicle/VehicleHeader";
// Slides are rendered inside a local carousel component
import VehicleOverviewCarousel from "@/components/vehicle/VehicleOverviewCarousel";
import VehicleTabs from "@/components/vehicle/VehicleTabs";
import VehicleTabController from "@/components/vehicle/VehicleTabController";
import { getVehicleCoverUrl } from "@/lib/getVehicleCoverUrl";
import DeleteVehicleButtonClient from "./DeleteVehicleButtonClient";
import MediaSection from "./media-section";
import VehicleWishlistBody from "@/components/vehicle/VehicleWishlistBody";
import TasksClient from "@/app/vehicles/[id]/tasks/TasksClient";
import TimelineClient, { type TimelineEvent } from "@/app/vehicles/[id]/timeline/TimelineClient";
import { getEventTypes } from "@/lib/eventTypes";
import { fetchVehicleEventsForCards } from "@/lib/timeline/enrichedEvents";
import VehicleReceiptsBody from "@/components/vehicle/VehicleReceiptsBody";
import BuyerSnapshot from "@/components/vehicle/BuyerSnapshot";
import UsageQuickLog from "@/components/usage/UsageQuickLog";
// Editing UI is no longer shown on the details landing; users can access it from a dedicated page later

export const dynamic = "force-dynamic";

export default async function VehicleOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();

  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, vin, year, make, model, trim, nickname, privacy, garage_id, photo_url")
    .eq("id", vehicleId)
    .maybeSingle();

  // Fetch prev/next vehicles in same garage by created_at order
  let prevId: string | null = null;
  let nextId: string | null = null;
  if (vehicle?.garage_id) {
    const { data: siblings } = await supabase
      .from("vehicle")
      .select("id")
      .eq("garage_id", vehicle.garage_id as string)
      .order("created_at", { ascending: false });
    const ids = (siblings ?? []).map((r: { id: string }) => r.id);
    const idx = ids.indexOf(vehicleId);
    if (idx !== -1) {
      // Wrap-around prev/next
      prevId = ids[(idx + 1) % ids.length] ?? null;
      nextId = ids[(idx - 1 + ids.length) % ids.length] ?? null;
    }
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Vehicle</h1>
          <Link href="/vehicles" className="text-sm text-blue-600 hover:underline">Back</Link>
        </div>
        <div className="text-gray-600">Not found.</div>
      </div>
    );
  }

  // Quick stats and snapshots (cheap queries)
  // Counts
  const [openTasksRes, doneTasksRes, recentEventsRes, tasksPeekRes, eventsPeekRes] = await Promise.all([
    supabase.from("work_item").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicleId).in("status", ["PLANNED", "IN_PROGRESS"]),
    supabase.from("work_item").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicleId).eq("status", "DONE"),
    supabase.from("event").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicleId),
    supabase.from("work_item").select("id, title, due, tags").eq("vehicle_id", vehicleId).in("status", ["PLANNED", "IN_PROGRESS"]).order("created_at", { ascending: true }).limit(3),
    supabase.from("event").select("id, created_at, type, notes").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }).limit(3),
  ]);

  const openCount = openTasksRes.count ?? 0;
  const doneCount = doneTasksRes.count ?? 0;
  const eventCount = recentEventsRes.count ?? 0;
  const tasksPeek = (tasksPeekRes.data ?? []) as { id: string; title: string; due: string | null; tags: string[] | null }[];
  const eventsPeek = (eventsPeekRes.data ?? []) as { id: string; created_at: string; type: string; notes: string | null }[];

  // Last activity: most recent of event or done task
  let lastActivityISO: string | null = null;
  {
    const [lastEventRes, lastDoneTaskRes] = await Promise.all([
      supabase.from("event").select("created_at").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("work_item").select("updated_at").eq("vehicle_id", vehicleId).eq("status", "DONE").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const lastEvent = (lastEventRes.data as { created_at?: string } | null)?.created_at ?? null;
    const lastDone = (lastDoneTaskRes.data as { updated_at?: string } | null)?.updated_at ?? null;
    lastActivityISO = [lastEvent, lastDone].filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] ?? null;
  }

  const coverUrl = await getVehicleCoverUrl(supabase, vehicleId, (vehicle as { photo_url?: string | null } | null)?.photo_url ?? null);

  // Fetch specs from vehicle_data with robust matching
  let specs: Record<string, string | number | null> | null = null;
  try {
    if (vehicle?.year && vehicle?.make && vehicle?.model) {
      const makeVal = String(vehicle.make);
      const modelVal = String(vehicle.model);
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const wantMake = normalize(makeVal);
      const wantModel = normalize(modelVal);

      // Try a few select patterns in order of likelihood
      const tryCombos: Array<{ y: string; m: string; d: string }> = [
        { y: "year", m: "make", d: "model" },
        { y: "new_year", m: "make", d: "model" },
        { y: "year", m: "new_make", d: "new_model" },
        { y: "new_year", m: "new_make", d: "new_model" },
      ];

      for (const c of tryCombos) {
        const { data } = await supabase
          .from("vehicle_data")
          .select("*")
          .eq(c.y, vehicle.year as number)
          .ilike(c.m, `%${makeVal}%`)
          .ilike(c.d, `%${modelVal}%`)
          .limit(1);
        const r = Array.isArray(data) && data[0] ? (data[0] as Record<string, string | number | null>) : null;
        if (r) { specs = r; break; }
      }

      if (!specs) {
        // Final fallback: ignore year, pick closest by make/model, newest first
        const { data } = await supabase
          .from("vehicle_data")
          .select("*")
          .ilike("make", `%${makeVal}%`)
          .ilike("model", `%${modelVal}%`)
          .order("year", { ascending: false })
          .limit(1);
        const r2 = Array.isArray(data) && data[0] ? (data[0] as Record<string, string | number | null>) : null;
        if (r2) specs = r2;
      }

      if (!specs) {
        // Fallback: broad by year then normalize make/model in JS
        const { data: rows } = await supabase
          .from("vehicle_data")
          .select("*")
          .or(`year.eq.${vehicle.year},new_year.eq.${vehicle.year},model_year.eq.${vehicle.year}`)
          .limit(500);
        const list: Array<Record<string, string | number | null>> = Array.isArray(rows) ? (rows as Array<Record<string, string | number | null>>) : [];
        const getStr = (o: Record<string, unknown>, k: string): string | null => typeof o[k] === "string" && o[k] ? String(o[k]) : null;
        const pickRow = list.find((r) => {
          const candMake = getStr(r as Record<string, unknown>, "make") || getStr(r as Record<string, unknown>, "new_make") || getStr(r as Record<string, unknown>, "Make") || "";
          const candModel = getStr(r as Record<string, unknown>, "model") || getStr(r as Record<string, unknown>, "new_model") || getStr(r as Record<string, unknown>, "Model") || "";
          return normalize(candMake).includes(wantMake) && normalize(candModel).includes(wantModel);
        }) || null;
        specs = pickRow;
      }
    }
  } catch {}

  // Full Timeline data (for in-page timeline tab)
  const enriched = await fetchVehicleEventsForCards(supabase, vehicleId);
  type EventType = "SERVICE" | "INSTALL" | "INSPECT" | "TUNE";
  const mapType = (t: EventType): TimelineEvent["type"] => {
    switch (t) {
      case "SERVICE":
        return "SERVICE";
      case "INSTALL":
        return "MOD";
      case "INSPECT":
        return "NOTE";
      case "TUNE":
        return "DYNO";
      default:
        return "NOTE";
    }
  };
  const eventTypes = await getEventTypes();
  const timelineEvents: TimelineEvent[] = enriched.map((e) => ({
    id: e.id,
    vehicle_id: vehicleId,
    type: mapType(e.db_type as EventType),
    title: e.title,
    notes: e.notes,
    display_type: e.display_type,
    display_icon: e.display_icon,
    display_color: e.display_color,
    display_label: e.display_label,
    occurred_at: e.occurred_at ?? e.created_at,
    occurred_on: e.occurred_on ?? (e.created_at ? e.created_at.slice(0,10) : null),
    date_confidence: e.date_confidence,
    created_at: e.created_at,
    updated_at: e.updated_at,
  } as TimelineEvent));

  // Full Tasks data (for in-page jobs tab)
  const { data: items } = await supabase
    .from("work_item")
    .select("id, title, status, tags, due, build_plan_id")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: true });
  const { data: plans } = await supabase
    .from("build_plans")
    .select("id, name, is_default")
    .eq("vehicle_id", vehicleId)
    .order("updated_at", { ascending: false });
  const initialItems = (items ?? []) as unknown as import("@/app/vehicles/[id]/tasks/TasksBoardClient").WorkItem[];
  const plansList = (plans ?? []) as { id: string; name: string; is_default: boolean }[];
  const defaultPlanId = plansList.find(p => p.is_default)?.id ?? (plansList[0]?.id ?? null);

  // Determine permissions for tasks editing (VIEWER => read-only; CONTRIBUTOR+ => write)
  type Role = "OWNER" | "MANAGER" | "CONTRIBUTOR" | "VIEWER";
  async function getRole(garageId: string | null | undefined): Promise<Role|null> {
    if (!garageId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: m } = await supabase
      .from("garage_member")
      .select("role")
      .eq("garage_id", garageId as string)
      .eq("user_id", user.id)
      .maybeSingle();
    return (m?.role as Role) ?? null;
  }
  const role = await getRole((vehicle as { garage_id?: string } | null)?.garage_id ?? null);
  const canWrite = role === "OWNER" || role === "MANAGER" || role === "CONTRIBUTOR";

  // Media list from Supabase Storage (public URLs)
  let mediaItems: { id: string; src: string; fullSrc: string; alt?: string }[] = [];
  try {
    const prefix = `${vehicleId}/`;
    const { data: list } = await supabase.storage.from("vehicle-media").list(prefix, { limit: 200 });
    const files = (list ?? []) as Array<{ name: string }>;
    mediaItems = files
      .filter(f => /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(f.name))
      .map(f => {
        const path = `${prefix}${f.name}`;
        const { data } = supabase.storage.from("vehicle-media").getPublicUrl(path);
        const url = data.publicUrl;
        return { id: path, src: url, fullSrc: url, alt: f.name };
      });
  } catch {}
  // Cap gallery at 10 for now
  mediaItems = mediaItems.slice(0, 10);

  return (
    <div className="space-y-6">
      <VehicleHeader vehicle={{ id: vehicle.id as string, nickname: vehicle.nickname, year: vehicle.year, make: vehicle.make, model: vehicle.model, privacy: vehicle.privacy }} coverUrl={coverUrl} />
      <VehicleTabs vehicleId={vehicleId} />

      {/* Buyer at-a-glance */}
      <BuyerSnapshot vehicleId={vehicle.id as string} />
      <UsageQuickLog vehicleId={vehicle.id as string} />

      {/* Inject prev/next links into arrows */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(() => {
            const prev = ${JSON.stringify(prevId)};
            const next = ${JSON.stringify(nextId)};
            const root = document.currentScript?.parentElement;
            if (!root) return;
            const prevA = root.querySelector('a[data-testid="veh-prev"]');
            const nextA = root.querySelector('a[data-testid="veh-next"]');
            if (prevA) {
              if (prev) { prevA.setAttribute('href', '/vehicles/' + prev); prevA.removeAttribute('aria-disabled'); }
              else { prevA.setAttribute('aria-disabled', 'true'); prevA.classList.add('opacity-40','cursor-not-allowed'); }
            }
            if (nextA) {
              if (next) { nextA.setAttribute('href', '/vehicles/' + next); nextA.removeAttribute('aria-disabled'); }
              else { nextA.setAttribute('aria-disabled', 'true'); nextA.classList.add('opacity-40','cursor-not-allowed'); }
            }
            // Keyboard support
            document.addEventListener('keydown', (e) => {
              if (e.key === 'ArrowLeft' && prev && prevA && !prevA.hasAttribute('aria-disabled')) {
                e.preventDefault(); location.assign('/vehicles/' + prev);
              }
              if (e.key === 'ArrowRight' && next && nextA && !nextA.hasAttribute('aria-disabled')) {
                e.preventDefault(); location.assign('/vehicles/' + next);
              }
            });
          })();`,
        }}
      />

      {/* Dashboard-like overview panels below: content is toggled by nav links rather than tabs */}
      <div id="veh-content-overview" data-section="overview">
        <VehicleOverviewCarousel
          vehicle={{ id: vehicle.id as string, nickname: vehicle.nickname, year: vehicle.year, make: vehicle.make, model: vehicle.model }}
          quickStats={{ lastActivityISO, openTaskCount: openCount, doneTaskCount: doneCount, eventCount }}
          tasks={tasksPeek}
          events={eventsPeek}
          specs={specs || undefined}
        />
      </div>

      <div id="veh-content-media" data-section="media" style={{ display: 'none' }}>
        <MediaSection media={mediaItems} vehicleId={vehicleId} />
      </div>

      <div id="veh-content-wishlist" data-section="wishlist" style={{ display: 'none' }}>
        <VehicleWishlistBody vehicleId={vehicleId} />
      </div>

      <div id="veh-content-jobs" data-section="jobs" style={{ display: 'none' }}>
        <TasksClient vehicleId={vehicleId} initialItems={initialItems} canWrite={canWrite} plans={plansList} defaultPlanId={defaultPlanId} />
      </div>

      <div id="veh-content-timeline" data-section="timeline" style={{ display: 'none' }}>
        <TimelineClient events={timelineEvents} vehicleId={vehicleId} canWrite={true} eventTypes={eventTypes} />
      </div>

      <div id="veh-content-receipts" data-section="receipts" style={{ display: 'none' }}>
        <VehicleReceiptsBody vehicleId={vehicleId} />
      </div>

      {/* Client-side content router for sub-navigation */}
      <VehicleTabController />

      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          <DeleteVehicleButtonClient vehicleId={vehicleId} />
        </div>
      </div>
    </div>
  );
}


