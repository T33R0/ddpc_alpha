import Link from "next/link";
import { SignInButton } from "@/components/auth/SignInButton";
import Image from "next/image";
import { getServerSupabase } from "@/lib/supabase";

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

  const [{ data: vehicles }, { data: upcoming }, { data: recent }] = await Promise.all([
    supabase.from("vehicle").select("id, nickname, year, make, model, photo_url").order("updated_at", { ascending: false }).limit(6),
    supabase.from("work_item").select("id, title, due, vehicle_id").not("due", "is", null).order("due", { ascending: true }).limit(6),
    supabase.from("event").select("id, notes, created_at, vehicle_id, type").order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div />
      </header>
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
