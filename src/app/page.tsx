import Link from "next/link";
import { SignInButton } from "@/components/auth/SignInButton";
import Image from "next/image";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const demoId = process.env.PUBLIC_VEHICLE_ID?.trim();
    return (
      <div className="min-h-screen p-8 space-y-6" data-testid="dashboard-hero">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">ddpc alpha</h1>
          <div />
        </header>
        <div className="space-y-4">
          <p className="text-muted max-w-2xl">Track vehicles like repos. Plan work with Tasks and log what actually happened on the Timeline. Collaborate with your garage with privacy by default.</p>
          <div className="flex items-center gap-3">
            <SignInButton className="bg-brand text-white rounded px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" data-testid="cta-signin-google" />
            {demoId && (<Link href={`/v/${demoId}`} className="text-brand hover:underline" data-testid="cta-demo">See a public demo</Link>)}
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Determine user's garages to scope dashboard data strictly to "my" context
  const garageIds: string[] = [];
  try {
    const { data: gm } = await supabase
      .from("garage_member")
      .select("garage_id")
      .order("created_at", { ascending: false })
      .limit(200);
    (gm as Array<{ garage_id: string }> | null)?.forEach((r) => garageIds.push(r.garage_id));
    // If user owns garages not in member table, include them by selecting owned garages
    const { data: owned } = await supabase
      .from("garage")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(200);
    (owned as Array<{ id: string }> | null)?.forEach((g) => {
      if (!garageIds.includes(g.id)) garageIds.push(g.id);
    });
  } catch {}

  const [
    { data: vehicles },
    { data: upcoming },
    { data: recent },
    openTasksCountRes,
    overdueTasksCountRes,
    vehiclesCountRes,
    { data: overdue }
  ] = await Promise.all([
    // Vehicles for "My Garage" (restrict to membership/ownership)
    (async () => {
      if (garageIds.length === 0) return { data: [] } as { data: unknown };
      return await supabase
        .from("vehicle")
        .select("id, nickname, year, make, model, photo_url, created_at, garage_id")
        .in("garage_id", garageIds)
        .order("created_at", { ascending: false })
        .limit(6);
    })(),
    // Upcoming tasks (active statuses, due today or later) scoped to user's garages
    (async () => {
      if (garageIds.length === 0) return { data: [] } as { data: unknown };
      return await supabase
        .from("work_item")
        .select("id, title, due, vehicle_id, vehicle:vehicle!inner(garage_id)")
        .in("status", ["PLANNED", "IN_PROGRESS"])
        .not("due", "is", null)
        .gte("due", today)
        .in("vehicle.garage_id", garageIds)
        .order("due", { ascending: true })
        .limit(6);
    })(),
    // Recent events scoped to user's garages
    (async () => {
      if (garageIds.length === 0) return { data: [] } as { data: unknown };
      return await supabase
        .from("event")
        .select("id, notes, created_at, vehicle_id, type, vehicle:vehicle!inner(garage_id)")
        .in("vehicle.garage_id", garageIds)
        .order("created_at", { ascending: false })
        .limit(10);
    })(),
    // Stats: open tasks count scoped
    (async () => {
      if (garageIds.length === 0) return { count: 0 } as { count: number };
      return await supabase
        .from("work_item")
        .select("id, vehicle:vehicle!inner(garage_id)", { count: "exact", head: true })
        .in("status", ["PLANNED", "IN_PROGRESS"])
        .in("vehicle.garage_id", garageIds);
    })(),
    // Stats: overdue tasks count scoped
    (async () => {
      if (garageIds.length === 0) return { count: 0 } as { count: number };
      return await supabase
        .from("work_item")
        .select("id, vehicle:vehicle!inner(garage_id)", { count: "exact", head: true })
        .in("status", ["PLANNED", "IN_PROGRESS"])
        .lt("due", today)
        .in("vehicle.garage_id", garageIds);
    })(),
    // Stats: vehicles count scoped
    (async () => {
      if (garageIds.length === 0) return { count: 0 } as { count: number };
      return await supabase
        .from("vehicle")
        .select("id", { count: "exact", head: true })
        .in("garage_id", garageIds);
    })(),
    // Overdue tasks list scoped
    (async () => {
      if (garageIds.length === 0) return { data: [] } as { data: unknown };
      return await supabase
        .from("work_item")
        .select("id, title, due, vehicle_id, vehicle:vehicle!inner(garage_id)")
        .in("status", ["PLANNED", "IN_PROGRESS"])
        .not("due", "is", null)
        .lt("due", today)
        .in("vehicle.garage_id", garageIds)
        .order("due", { ascending: true })
        .limit(6);
    })(),
  ]);

  const vehiclesCount = vehiclesCountRes.count ?? 0;
  const openTasksCount = openTasksCountRes.count ?? 0;
  const overdueTasksCount = overdueTasksCountRes.count ?? 0;

  // Derive recently active vehicles by deduping vehicle_ids from recent events
  const recentVehicleIds: string[] = Array.from(
    new Set(((recent ?? []) as Array<{ vehicle_id: string }>).map((e) => e.vehicle_id))
  ).slice(0, 6);
  let recentVehicles: Array<{ id: string; nickname: string | null; year: number | null; make: string | null; model: string | null; photo_url: string | null }> = [];
  if (recentVehicleIds.length > 0) {
    const { data: rv } = await supabase
      .from("vehicle")
      .select("id, nickname, year, make, model, photo_url")
      .in("id", recentVehicleIds);
    recentVehicles = (rv ?? []) as typeof recentVehicles;
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div />
      </header>
      {/* Stats row */}
      <div className="grid md:grid-cols-3 gap-4">
        <section className="rounded-2xl border bg-card shadow-sm p-4" data-testid="dashboard-stat-vehicles">
          <div className="text-sm text-muted">Vehicles</div>
          <div className="text-2xl font-semibold">{vehiclesCount}</div>
        </section>
        <section className="rounded-2xl border bg-card shadow-sm p-4" data-testid="dashboard-stat-open-tasks">
          <div className="text-sm text-muted">Open tasks</div>
          <div className="text-2xl font-semibold">{openTasksCount}</div>
        </section>
        <section className="rounded-2xl border bg-card shadow-sm p-4" data-testid="dashboard-stat-overdue">
          <div className="text-sm text-muted">Overdue</div>
          <div className="text-2xl font-semibold">{overdueTasksCount}</div>
        </section>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <section className="rounded-2xl border bg-card shadow-sm p-4" data-testid="dashboard-garage">
          <div className="text-sm font-semibold mb-3">My Garage</div>
          {(!vehicles || vehicles.length === 0) ? (
            <div className="text-sm text-muted">No vehicles yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(vehicles ?? []).map((v) => (
                <Link key={v.id} href={`/vehicles/${v.id}`} className="block border rounded overflow-hidden hover:shadow">
                  {v.photo_url ? (
                    <Image src={v.photo_url} alt={v.nickname ?? `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`} width={320} height={180} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-bg text-muted flex items-center justify-center">No photo</div>
                  )}
                  <div className="p-2 text-xs font-medium">{v.nickname ?? `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-2xl border bg-card shadow-sm p-4" data-testid="dashboard-upcoming-tasks">
          <div className="text-sm font-semibold mb-3">Upcoming Tasks</div>
          {(!upcoming || upcoming.length === 0) ? (
            <div className="text-sm text-muted">No upcoming tasks.</div>
          ) : (
            <ul className="space-y-1">
              {(upcoming ?? []).map((t) => (
                <li key={t.id} className="text-sm flex items-center justify-between">
                  <Link href={`/vehicles/${t.vehicle_id}/tasks`} className="hover:underline">{t.title}</Link>
                  <span className="text-xs text-muted">{t.due ? new Date(t.due).toLocaleDateString() : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border bg-card shadow-sm p-4" data-testid="dashboard-recent-events">
          <div className="text-sm font-semibold mb-3">Recent Events</div>
          {(!recent || recent.length === 0) ? (
            <div className="text-sm text-muted">No events.</div>
          ) : (
            <ul className="space-y-1">
              {(recent ?? []).map((e) => (
                <li key={e.id} className="text-sm flex items-center justify-between">
                  <Link href={`/vehicles/${e.vehicle_id}/timeline`} className="hover:underline">{e.notes ?? e.type}</Link>
                  <span className="text-xs text-muted">{new Date(e.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <section className="rounded-2xl border bg-card shadow-sm p-4" data-testid="dashboard-overdue-tasks">
          <div className="text-sm font-semibold mb-3">Overdue Tasks</div>
          {(!overdue || overdue.length === 0) ? (
            <div className="text-sm text-muted">No overdue tasks. Nice!</div>
          ) : (
            <ul className="space-y-1">
              {(overdue ?? []).map((t) => (
                <li key={t.id} className="text-sm flex items-center justify-between">
                  <Link href={`/vehicles/${t.vehicle_id}/tasks`} className="hover:underline">{t.title}</Link>
                  <span className="text-xs text-muted">{t.due ? new Date(t.due).toLocaleDateString() : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border bg-card shadow-sm p-4 col-span-2" data-testid="dashboard-recent-vehicles">
          <div className="text-sm font-semibold mb-3">Recently Active Vehicles</div>
          {recentVehicles.length === 0 ? (
            <div className="text-sm text-muted">No recent activity.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recentVehicles.map((v) => (
                <Link key={v.id} href={`/vehicles/${v.id}`} className="block border rounded overflow-hidden hover:shadow">
                  {v.photo_url ? (
                    <Image src={v.photo_url} alt={v.nickname ?? `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`} width={320} height={180} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-bg text-muted flex items-center justify-center">No photo</div>
                  )}
                  <div className="p-2 text-xs font-medium">{v.nickname ?? `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      <section className="rounded-2xl border bg-card shadow-sm p-4" data-testid="dashboard-quick-actions">
        <div className="text-sm font-semibold mb-3">Quick actions</div>
        <div className="flex items-center gap-3">
          <Link href="/vehicles" className="text-xs px-3 py-1 border rounded bg-bg">New Vehicle</Link>
          <Link href="/timeline" className="text-xs px-3 py-1 border rounded bg-bg">New Event</Link>
          <Link href="/tasks" className="text-xs px-3 py-1 border rounded bg-bg">New Task</Link>
        </div>
      </section>
    </div>
  );
}
