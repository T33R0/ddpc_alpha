"use client";

import { useEffect, useState } from "react";

type Job = {
\tid: string;
\ttitle: string;
\tstatus: "PLANNED" | "IN_PROGRESS" | "DONE";
\tstarted_at?: string | null;
};

export default function VehicleJobsBody({ vehicleId }: { vehicleId: string }) {
\tconst [jobs, setJobs] = useState<Job[]>([]);
\tconst [showWizard, setShowWizard] = useState(false);
\tconst [wishlist, setWishlist] = useState<Array<{ id: string; title: string }>>([]);
\tconst [selected, setSelected] = useState<Record<string, boolean>>({});
\tconst [busy, setBusy] = useState(false);

\tuseEffect(() => {
\t\tsetJobs([]);
\t\tsetWishlist([]);
\t}, [vehicleId]);

\tfunction chip(status: Job["status"]) {
\t\tconst map: Record<Job["status"], string> = {
\t\t\tPLANNED: "bg-amber-500/15 text-amber-500",
\t\t\tIN_PROGRESS: "bg-blue-500/15 text-blue-400",
\t\t\tDONE: "bg-emerald-500/15 text-emerald-400",
\t\t} as const;
\t\treturn <span className={`px-2 py-0.5 rounded text-xs ${map[status]}`}>{status.replace("_", " ")}</span>;
\t}

\tasync function startFromWishlist() { setShowWizard(true); }

\tasync function createJobs() {
\t\tconst ids = Object.keys(selected).filter((k) => selected[k]);
\t\tif (ids.length === 0) return setShowWizard(false);
\t\tsetBusy(true);
\t\ttry {
\t\t\tconst res = await fetch("/api/diy-jobs", {
\t\t\t\tmethod: "POST",
\t\t\t\theaders: { "content-type": "application/json" },
\t\t\t\tbody: JSON.stringify({ vehicleId, title: "DIY Job from Wishlist", wishlist_item_ids: ids }),
\t\t\t});
\t\t\tconst data = await res.json();
\t\t\tif (!res.ok) throw new Error(data?.error || "Failed to create jobs");
\t\t\ttype JobLike = Partial<Pick<Job, "id" | "title" | "status">>;
\t\t\tconst rawJobs: JobLike[] = Array.isArray((data as { jobs?: JobLike[] }).jobs)
\t\t\t\t? (data as { jobs: JobLike[] }).jobs
\t\t\t\t: ids.map((id: string) => ({ id, title: `Job for ${id}`, status: "PLANNED" as const }));
\t\t\tconst newJobs: Job[] = rawJobs.map((j) => ({ id: j.id ?? crypto.randomUUID(), title: j.title ?? "New Job", status: (j.status ?? "PLANNED") as Job["status"] }));
\t\t\tsetJobs((prev) => [...newJobs, ...prev]);
\t\t\tsetShowWizard(false);
\t\t\tsetSelected({});
\t\t} catch (e) {
\t\t\talert((e as Error).message);
\t\t} finally {
\t\t\tsetBusy(false);
\t\t}
\t}

\tasync function completeJob(id: string) {
\t\ttry {
\t\t\tconst res = await fetch(`/api/diy-jobs/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "DONE" }) });
\t\t\tif (!res.ok) throw new Error("Failed to complete job");
\t\t\tsetJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "DONE" } : j)));
\t\t} catch (e) {
\t\t\talert((e as Error).message);
\t\t}
\t}

\treturn (
\t\t<div className="space-y-6">
\t\t\t<div className="flex items-center justify-between">
\t\t\t\t<h1 className="text-2xl font-semibold">DIY Jobs</h1>
\t\t\t\t<button className="rounded bg-primary text-primary-foreground px-4 py-2 text-sm shadow" onClick={startFromWishlist}>Start from Wishlist</button>
\t\t\t</div>

\t\t\t{jobs.length === 0 ? (
\t\t\t\t<div className="text-muted">No jobs yet.</div>
\t\t\t) : (
\t\t\t\t<ul className="space-y-2">
\t\t\t\t\t{jobs.map((j) => (
\t\t\t\t\t\t<li key={j.id} className="rounded border bg-card text-card-foreground p-3 flex items-center justify-between">
\t\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t\t{chip(j.status)}
\t\t\t\t\t\t\t\t<div className="font-medium">{j.title}</div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div className="flex items-center gap-2">
\t\t\t\t\t\t\t\t{j.status !== "DONE" && (
\t\t\t\t\t\t\t\t\t<button className="text-emerald-500 hover:underline" onClick={() => completeJob(j.id)}>Complete Job</button>
\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</li>
\t\t\t\t\t))}
\t\t\t\t</ul>
\t\t\t)}

\t\t\t{showWizard && (
\t\t\t\t<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
\t\t\t\t\t<div className="w-full max-w-lg rounded bg-bg border shadow-xl">
\t\t\t\t\t\t<div className="p-4 border-b flex items-center justify-between">
\t\t\t\t\t\t\t<div className="font-semibold">Start from Wishlist</div>
\t\t\t\t\t\t\t<button className="text-muted hover:text-fg" onClick={() => setShowWizard(false)}>✕</button>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
\t\t\t\t\t\t\t{wishlist.length === 0 ? (
\t\t\t\t\t\t\t\t<div className="text-sm text-muted">No wishlist items available.</div>
\t\t\t\t\t\t\t) : (
\t\t\t\t\t\t\t\twishlist.map((w) => (
\t\t\t\t\t\t\t\t\t<label key={w.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30">
\t\t\t\t\t\t\t\t\t\t<input type="checkbox" checked={!!selected[w.id]} onChange={(e) => setSelected((s) => ({ ...s, [w.id]: e.target.checked }))} />
\t\t\t\t\t\t\t\t\t\t<span className="truncate">{w.title}</span>
\t\t\t\t\t\t\t\t\t</label>
\t\t\t\t\t\t\t\t))
\t\t\t\t\t\t\t)}
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="p-4 border-t flex items-center justify-end gap-2">
\t\t\t\t\t\t\t<button className="px-3 py-2 text-sm" onClick={() => setShowWizard(false)}>Cancel</button>
\t\t\t\t\t\t\t<button className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50" onClick={createJobs} disabled={busy}>Create Jobs</button>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t)}
\t\t</div>
\t);
}


