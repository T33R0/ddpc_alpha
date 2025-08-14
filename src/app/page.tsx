import Link from "next/link";
import Image from "next/image";
import { SignInButton } from "@/components/auth/SignInButton";
import { getServerSupabase } from "@/lib/supabase";
import CopyToClipboard from "@/components/CopyToClipboard";
import { serverLog } from "@/lib/serverLog";
import PrivacyBadge from "@/components/PrivacyBadge";
import { getVehicleCoverUrl } from "@/lib/getVehicleCoverUrl";
import UpcomingListClient from "@/components/dashboard/UpcomingListClient";
import ActivityFeedClient from "@/components/dashboard/ActivityFeedClient";
import { SpendBreakdownChart, MilesTrendChart } from "@/components/dashboard/Charts";

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

  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  const ninetyDaysAgoISO = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

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
    // Vehicles total scoped
    vehiclesCountRes,
    // Open/Overdue counts scoped
    openTasksCountRes,
    overdueTasksCountRes,
    // Next due (soonest)
    { data: nextDueRow },
    // Spend YTD and Miles YTD (owner-scoped)
    { data: spendRows },
    { data: milesRows },
    // Recent events (10)
    { data: recent },
    // Upcoming tasks next 7 days and overdue
    { data: upcoming },
    // Vehicles at a glance (top 3 by last_event_at)
    { data: topVehiclesRaw },
    // Alerts: overdue tasks list (limit 6)
    { data: overdue }
  ] = await Promise.all([
    (async () => {
      if (garageIds.length === 0) return { count: 0 } as { count: number };
      return await supabase
        .from("vehicle")
        .select("id", { count: "exact", head: true })
        .in("garage_id", garageIds);
    })(),
    (async () => {
      if (garageIds.length === 0) return { count: 0 } as { count: number };
      return await supabase
        .from("work_item")
        .select("id, vehicle:vehicle!inner(garage_id)", { count: "exact", head: true })
        .in("status", ["PLANNED", "IN_PROGRESS"])
        .in("vehicle.garage_id", garageIds);
    })(),
    (async () => {
      if (garageIds.length === 0) return { count: 0 } as { count: number };
      return await supabase
        .from("work_item")
        .select("id, vehicle:vehicle!inner(garage_id)", { count: "exact", head: true })
        .in("status", ["PLANNED", "IN_PROGRESS"])
        .lt("due", today)
        .in("vehicle.garage_id", garageIds);
    })(),
    (async () => {
      if (garageIds.length === 0) return { data: [{ next_due: null }] } as { data: Array<{ next_due: string | null }> };
      const { data } = await supabase
        .from("work_item")
        .select("due, vehicle:vehicle!inner(garage_id)")
        .in("status", ["PLANNED", "IN_PROGRESS"])
        .not("due", "is", null)
        .in("vehicle.garage_id", garageIds)
        .order("due", { ascending: true })
        .limit(1);
      return { data: [{ next_due: Array.isArray(data) && data[0] ? (data[0] as { due: string }).due : null }] };
    })(),
    // Spend YTD across events with cost
    (async () => {
      if (garageIds.length === 0) return { data: [{ spend_ytd: 0 }] } as { data: Array<{ spend_ytd: number }> };
      const { data } = await supabase
        .from("event")
        .select("cost, created_at, vehicle:vehicle!inner(garage_id)")
        .gte("created_at", startOfYear)
        .in("vehicle.garage_id", garageIds);
      const rows = Array.isArray(data) ? (data as Array<{ cost: number | null }>) : [];
      const sum = rows.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
      return { data: [{ spend_ytd: sum }] };
    })(),
    // Miles YTD across odometer events
    (async () => {
      if (garageIds.length === 0) return { data: [{ miles_ytd: 0 }] } as { data: Array<{ miles_ytd: number }> };
      const { data } = await supabase
        .from("event")
        .select("odometer, created_at, vehicle:vehicle!inner(garage_id)")
        .gte("created_at", startOfYear)
        .not("odometer", "is", null)
        .in("vehicle.garage_id", garageIds)
        .order("created_at", { ascending: true });
      const rows = Array.isArray(data) ? (data as Array<{ odometer: number | null }>) : [];
      const odo = rows.map(r => Number(r.odometer)).filter(n => !Number.isNaN(n));
      const miles = odo.length > 0 ? Math.max(...odo) - Math.min(...odo) : 0;
      return { data: [{ miles_ytd: miles }] };
    })(),
    (async () => {
      if (garageIds.length === 0) return { data: [] } as { data: unknown };
      return await supabase
        .from("event")
        .select("id, notes, created_at, vehicle_id, type, vehicle:vehicle!inner(garage_id)")
        .in("vehicle.garage_id", garageIds)
        .order("created_at", { ascending: false })
        .limit(10);
    })(),
    (async () => {
      if (garageIds.length === 0) return { data: [] } as { data: unknown };
      const seven = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return await supabase
        .from("work_item")
        .select("id, title, due, vehicle_id, status, vehicle:vehicle!inner(garage_id)")
        .in("status", ["PLANNED", "IN_PROGRESS"])
        .not("due", "is", null)
        .lte("due", seven)
        .in("vehicle.garage_id", garageIds)
        .order("due", { ascending: true })
        .limit(50);
    })(),
    (async () => {
      if (garageIds.length === 0) return { data: [] } as { data: unknown };
      return await supabase
        .from("vehicle")
        .select("id, nickname, year, make, model, photo_url, privacy, last_event_at, garage_id")
        .in("garage_id", garageIds)
        .order("last_event_at", { ascending: false })
        .limit(3);
    })(),
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
  const nextDue: string | null = Array.isArray(nextDueRow) ? (nextDueRow[0] as { next_due: string | null }).next_due : (nextDueRow as unknown as { next_due: string | null }).next_due;
  const spendYTD = Array.isArray(spendRows) && spendRows[0] ? (spendRows[0] as { spend_ytd: number }).spend_ytd : 0;
  const milesYTD = Array.isArray(milesRows) && milesRows[0] ? (milesRows[0] as { miles_ytd: number }).miles_ytd : 0;

  // Health composite: 100 - clamp(overdue*6 + due_7d*2 + open*1, 0, 100)
  const dueSoonCount = Array.isArray(upcoming) ? (upcoming as Array<{ id: string; due: string }>).filter(r => {
    try { return r.due && new Date(r.due) >= new Date(today); } catch { return false; }
  }).length : 0;
  const rawHealth = 100 - Math.min(100, overdueTasksCount * 6 + dueSoonCount * 2 + openTasksCount * 1);
  const health = Math.max(0, rawHealth);

  // Vehicles at a glance enrichments
  const topVehicles = (Array.isArray(topVehiclesRaw) ? topVehiclesRaw : []) as Array<{ id: string; nickname: string | null; year: number | null; make: string | null; model: string | null; photo_url: string | null; privacy: string | null; last_event_at: string | null }>;
  const topIds = topVehicles.map(v => v.id);
  const perVehicle: Record<string, {
    openTasks: number;
    nextDue: string | null;
    spendYTD: number;
    milesYTD: number;
    defaultPlanName: string | null;
  }> = {};
  if (topIds.length > 0) {
    const [nextDueByVehRes, spendByVehRes, milesByVehRes, plansRes] = await Promise.all([
      supabase.from("work_item").select("vehicle_id, due").in("vehicle_id", topIds).in("status", ["PLANNED", "IN_PROGRESS"]).not("due", "is", null).order("due", { ascending: true }),
      supabase.from("event").select("vehicle_id, cost, created_at").in("vehicle_id", topIds).gte("created_at", startOfYear),
      supabase.from("event").select("vehicle_id, odometer, created_at").in("vehicle_id", topIds).gte("created_at", startOfYear).not("odometer", "is", null).order("created_at", { ascending: true }),
      supabase.from("build_plans").select("vehicle_id, name, is_default").in("vehicle_id", topIds).eq("is_default", true),
    ]);
    // openByVehRes.count is global; instead compute via grouping nextDueByVehRes or separate query per id is heavy; fallback to counting from work_item select without head
    const { data: openItems } = await supabase.from("work_item").select("id, vehicle_id").in("vehicle_id", topIds).in("status", ["PLANNED", "IN_PROGRESS"]);
    const openCounts: Record<string, number> = {};
    (openItems ?? []).forEach((wi: { vehicle_id: string }) => { openCounts[wi.vehicle_id] = (openCounts[wi.vehicle_id] ?? 0) + 1; });
    const nextDueMap: Record<string, string | null> = {};
    (nextDueByVehRes.data ?? []).forEach((row: { vehicle_id: string; due: string }) => {
      if (!(row.vehicle_id in nextDueMap)) nextDueMap[row.vehicle_id] = row.due;
    });
    const spendMap: Record<string, number> = {};
    (spendByVehRes.data ?? []).forEach((r: { vehicle_id: string; cost: number | null }) => { spendMap[r.vehicle_id] = (spendMap[r.vehicle_id] ?? 0) + (Number(r.cost) || 0); });
    const milesMap: Record<string, number> = {};
    const groupedOdo: Record<string, number[]> = {};
    (milesByVehRes.data ?? []).forEach((r: { vehicle_id: string; odometer: number | null }) => {
      const val = Number(r.odometer);
      if (Number.isNaN(val)) return;
      (groupedOdo[r.vehicle_id] ??= []).push(val);
    });
    for (const vid of Object.keys(groupedOdo)) {
      const arr = groupedOdo[vid];
      if (arr.length > 0) milesMap[vid] = Math.max(...arr) - Math.min(...arr);
    }
    const planMap: Record<string, string | null> = {};
    (plansRes.data ?? []).forEach((p: { vehicle_id: string; name: string; is_default: boolean }) => { if (p.is_default) planMap[p.vehicle_id] = p.name; });
    for (const vid of topIds) {
      perVehicle[vid] = {
        openTasks: openCounts[vid] ?? 0,
        nextDue: nextDueMap[vid] ?? null,
        spendYTD: spendMap[vid] ?? 0,
        milesYTD: milesMap[vid] ?? 0,
        defaultPlanName: planMap[vid] ?? null,
      };
    }
  }

  // Compute spend breakdown YTD and miles trend 12mo for charts
  const { data: spendCat } = await supabase
    .from("event")
    .select("type, cost, created_at, vehicle:vehicle!inner(garage_id)")
    .gte("created_at", startOfYear)
    .in("vehicle.garage_id", garageIds);
  const spendBreakdown = (() => {
    const rows = Array.isArray(spendCat) ? (spendCat as Array<{ type: string; cost: number | null }>) : [];
    const service = rows.filter(r => r.type === "SERVICE").reduce((a, r) => a + (Number(r.cost) || 0), 0);
    const mods = rows.filter(r => r.type === "INSTALL" || r.type === "TUNE").reduce((a, r) => a + (Number(r.cost) || 0), 0);
    return { service, mods } as { service: number; mods: number };
  })();
  const twelveMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const { data: milesCat } = await supabase
    .from("event")
    .select("odometer, created_at, vehicle:vehicle!inner(garage_id)")
    .gte("created_at", twelveMonthsAgo.toISOString())
    .not("odometer", "is", null)
    .in("vehicle.garage_id", garageIds)
    .order("created_at", { ascending: true });
  const milesTrend = (() => {
    const points: Array<{ month: string; value: number }> = [];
    const rows = Array.isArray(milesCat) ? (milesCat as Array<{ odometer: number | null; created_at: string }>) : [];
    // Group by YYYY-MM
    const groups: Record<string, number[]> = {};
    rows.forEach(r => {
      const d = new Date(r.created_at);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const val = Number(r.odometer);
      if (!Number.isNaN(val)) (groups[key] ??= []).push(val);
    });
    // Build 12 months sequence
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const arr = groups[key] ?? [];
      const val = arr.length > 0 ? Math.max(...arr) - Math.min(...arr) : 0;
      points.push({ month: key, value: val });
    }
    return points;
  })();
  // Rolling 90d CPM
  const { data: last90 } = await supabase
    .from("event")
    .select("cost, odometer, created_at, vehicle:vehicle!inner(garage_id)")
    .gte("created_at", ninetyDaysAgoISO)
    .in("vehicle.garage_id", garageIds);
  const last90Rows = Array.isArray(last90) ? (last90 as Array<{ cost: number | null; odometer: number | null }>) : [];
  const cost90 = last90Rows.reduce((a, r) => a + (Number(r.cost) || 0), 0);
  const odo90 = last90Rows.map(r => Number(r.odometer)).filter(n => !Number.isNaN(n));
  const miles90 = odo90.length > 0 ? Math.max(...odo90) - Math.min(...odo90) : 0;
  const cpm90 = miles90 > 0 ? cost90 / miles90 : null;
  // Avg days between services (fleet-wide)
  const { data: svcRows } = await supabase
    .from("event")
    .select("created_at, type, vehicle:vehicle!inner(garage_id)")
    .eq("type", "SERVICE")
    .in("vehicle.garage_id", garageIds)
    .order("created_at", { ascending: true });
  const svcDates = (Array.isArray(svcRows) ? svcRows : []).map((r: { created_at: string }) => new Date(r.created_at).getTime());
  const diffs: number[] = [];
  for (let i = 1; i < svcDates.length; i++) diffs.push((svcDates[i] - svcDates[i - 1]) / (1000 * 60 * 60 * 24));
  const avgDaysBetween = diffs.length > 0 ? Math.round(diffs.reduce((a, n) => a + n, 0) / diffs.length) : null;

  // Log KPI load (sampled)
  serverLog("owner_dashboard_kpi", { vehiclesCount, openTasksCount });

  type TaskRow = { id: string; title: string; due: string | null; vehicle_id: string; status: string };
  type EventRow = { id: string; notes: string | null; created_at: string; vehicle_id: string; type: string };
  const upcomingArr: TaskRow[] = Array.isArray(upcoming) ? (upcoming as TaskRow[]) : [];
  const recentArr: EventRow[] = Array.isArray(recent) ? (recent as EventRow[]) : [];
  const overdueArr: TaskRow[] = Array.isArray(overdue) ? (overdue as TaskRow[]) : [];

  const heroCoverUrl = topVehicles[0] ? await getVehicleCoverUrl(supabase, topVehicles[0].id, topVehicles[0].photo_url) : null;

  return (
    <div className="min-h-screen p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="md:col-span-2 space-y-5">
          {/* Hero card */}
          <section className="rounded-2xl border border-neutral-800 bg-[#111318] overflow-hidden">
            {heroCoverUrl ? (
              <Image src={heroCoverUrl} alt="Garage" width={1200} height={600} className="w-full h-60 object-cover" />
            ) : (
              <div className="w-full h-60 bg-bg/40" />
            )}
            <div className="p-4">
              <Link href="/vehicles?new=1" className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">+ Add Vehicle</Link>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="rounded-2xl border bg-card shadow-sm p-4">
            <div className="text-sm font-semibold mb-3">Recent Activity</div>
            <ActivityFeedClient items={recentArr} />
          </section>

          {/* Upcoming Tasks */}
          <section className="rounded-2xl border bg-card shadow-sm p-4">
            <div className="text-sm font-semibold mb-3">Upcoming Tasks</div>
            <UpcomingListClient items={upcomingArr} />
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Overview KPIs */}
          <section className="rounded-2xl border bg-card shadow-sm p-4">
            <div className="text-sm font-semibold mb-2">Overview</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-muted">Vehicle</div>
                <div className="text-xl font-semibold">{vehiclesCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Active Tasks</div>
                <div className="text-xl font-semibold">{openTasksCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Miles Driven</div>
                <div className="text-xl font-semibold">{milesYTD > 0 ? Math.round(milesYTD) : "—"}<span className="text-xs align-top"> mi</span></div>
              </div>
            </div>
          </section>

          {/* Performance */}
          <section className="rounded-2xl border bg-card shadow-sm p-4">
            <div className="text-sm font-semibold mb-3">Performance</div>
            <MilesTrendChart points={milesTrend} />
          </section>

          {/* Tagged/Alerts minimal */}
          <section className="rounded-2xl border bg-card shadow-sm p-4">
            <div className="text-sm font-semibold mb-2">Tagged</div>
            {overdueArr.length === 0 ? (
              <div className="text-sm text-muted">No tags yet</div>
            ) : (
              <div className="text-sm">{overdueArr[0].title} — {overdueArr[0].due ? prettyDue(overdueArr[0].due, today) : "—"}</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function prettyDue(iso: string, todayStr: string): string {
  try {
    const d = new Date(iso);
    const today = new Date(todayStr);
    const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff > 1) return `In ${diff}d`;
    if (diff === -1) return "Yesterday";
    return `${Math.abs(diff)}d overdue`;
  } catch { return "—"; }
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatCurrency(n: number): string {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); } catch { return `$${Math.round(n)}`; }
}

async function SharePrivacySection() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // List PUBLIC vehicles the user can access (owned or member)
  const { data } = await supabase
    .from("vehicle")
    .select("id, nickname, year, make, model, privacy, photo_url, last_event_at, created_at")
    .eq("privacy", "PUBLIC")
    .order("last_event_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);
  const arr = Array.isArray(data) ? (data as Array<{ id: string; nickname: string | null; year: number | null; make: string | null; model: string | null; photo_url: string | null }>) : [];
  if (arr.length === 0) return null;
  return (
    <section className="rounded-2xl border bg-card shadow-sm p-4">
      <div className="text-sm font-semibold mb-3">Share & Privacy</div>
      <div className="space-y-2" data-testid="public-vehicles">
        {arr.map(v => {
          const name = v.nickname?.trim() || [v.year, v.make, v.model].filter(Boolean).join(" ");
          const href = `/v/${v.id}`;
          return (
            <div key={v.id} className="flex items-center justify-between border rounded p-2 bg-white">
              <Link href={href} className="text-sm hover:underline">{name || v.id}</Link>
              <div className="flex items-center gap-2">
                <CopyToClipboard text={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}${href}`} label="Copy link" dataTestId="public-copy-link" />
                <Link href={href} className="text-xs px-2 py-1 rounded border">Open</Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function PlanActivity() {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("build_plans")
    .select("id, vehicle_id, name, status, is_default, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);
  const arr = Array.isArray(data) ? (data as Array<{ id: string; vehicle_id: string; name: string; status: string; is_default: boolean; updated_at: string }>) : [];
  return (
    <div className="space-y-2" data-testid="plan-activity">
      {arr.length === 0 ? (
        <div className="text-sm text-muted">No recent plan activity.</div>
      ) : (
        arr.map(p => (
          <div key={p.id} className="flex items-center justify-between border rounded p-2 bg-white">
            <div className="text-sm">{p.name} — {p.status}{p.is_default ? " (default)" : ""}</div>
            <Link href={`/vehicles/${p.vehicle_id}/plans`} className="text-xs px-2 py-1 rounded border">View plan</Link>
          </div>
        ))
      )}
    </div>
  );
}
