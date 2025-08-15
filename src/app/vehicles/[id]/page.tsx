import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";
import VehicleHeader from "@/components/vehicle/VehicleHeader";
// Slides are rendered inside a local carousel component
import VehicleOverviewCarousel from "@/components/vehicle/VehicleOverviewCarousel";
import VehicleTabs from "@/components/vehicle/VehicleTabs";
import { getVehicleCoverUrl } from "@/lib/getVehicleCoverUrl";
import DeleteVehicleButtonClient from "./DeleteVehicleButtonClient";
import MediaSection from "./media-section";
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
        />
      </div>

      <div id="veh-content-media" data-section="media" style={{ display: 'none' }}>
        <MediaSection media={mediaItems} vehicleId={vehicleId} />
      </div>

      {/* Client-side content router for sub-navigation */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(() => {
            const sections = {
              overview: document.getElementById('veh-content-overview'),
              media: document.getElementById('veh-content-media')
            };
            function setActive(targetName) {
              document.querySelectorAll('a[data-veh-nav]').forEach((a) => {
                const t = a.getAttribute('data-target');
                const active = (t === targetName);
                const bar = a.querySelector('span');
                if (bar) bar.className = 'block h-[2px] mt-2 rounded-full transition-all duration-200 ' + (active ? 'bg-fg w-full' : 'bg-transparent w-0');
                const base = 'text-sm pb-3 transition-colors ';
                a.className = base + (active ? 'text-fg' : 'text-muted hover:text-fg');
              });
            }
            function show(section) {
              Object.keys(sections).forEach((key) => {
                const el = sections[key]; if (!el) return; el.style.display = key === section ? '' : 'none';
              });
              // Update active based on section + current slide
              if (section === 'media') { setActive('gallery'); return; }
              // Default to overview; try to reflect current slide if available
              try {
                // @ts-ignore
                const slide = window.__vehGetSlide ? window.__vehGetSlide() : 'OVERVIEW';
                const map = { OVERVIEW: 'overview', TIMELINE: 'timeline', TASKS: 'tasks', BUILD: 'build-plans', PARTS: 'parts', SPEC: 'display-page' };
                setActive(map[slide] || 'overview');
              } catch { setActive('overview'); }
            }
            // Default to overview unless URL includes /media or hash #gallery
            if (location.pathname.endsWith('/media') || location.hash === '#gallery') {
              history.replaceState({}, '', '/vehicles/${vehicleId}');
              show('media');
            } else {
              show('overview');
            }
            window.addEventListener('hashchange', () => {
              if (location.hash === '#gallery') show('media');
            });
            document.addEventListener('click', (e) => {
              const a = e.target.closest('a[data-veh-nav]');
              if (!a) return;
              const target = a.getAttribute('data-target');
              if (!target) return;
              // Map top-level items to internal slides/sections
              if (target === 'overview') { e.preventDefault(); show('overview'); window.__vehSetSlide && window.__vehSetSlide('OVERVIEW'); setActive('overview'); }
              if (target === 'timeline') { e.preventDefault(); show('overview'); window.__vehSetSlide && window.__vehSetSlide('TIMELINE'); setActive('timeline'); }
              if (target === 'tasks') { e.preventDefault(); show('overview'); window.__vehSetSlide && window.__vehSetSlide('TASKS'); setActive('tasks'); }
              if (target === 'build-plans') { e.preventDefault(); show('overview'); window.__vehSetSlide && window.__vehSetSlide('BUILD'); setActive('build-plans'); }
              if (target === 'parts') { e.preventDefault(); show('overview'); window.__vehSetSlide && window.__vehSetSlide('PARTS'); setActive('parts'); }
              if (target === 'display-page') { e.preventDefault(); show('overview'); window.__vehSetSlide && window.__vehSetSlide('SPEC'); setActive('display-page'); }
              if (target === 'gallery') { e.preventDefault(); show('media'); setActive('gallery'); }
            }, true);
          })();`
        }}
      />

      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          <DeleteVehicleButtonClient vehicleId={vehicleId} />
        </div>
      </div>
    </div>
  );
}


