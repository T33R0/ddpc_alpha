"use client";

import { useEffect, useState } from "react";

type Job = {
  id: string;
  title: string;
  status: "PLANNED" | "IN_PROGRESS" | "DONE";
  started_at?: string | null;
};

export default function VehicleJobsPage({ params }: { params: { id: string } }) {
  const vehicleId = params.id;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wishlist, setWishlist] = useState<Array<{ id: string; title: string }>>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Placeholder fetches; wire to GET /api/diy-jobs?vehicleId=... and /api/wishlist?vehicleId=...
    setJobs([]);
    setWishlist([]);
  }, [vehicleId]);

  function chip(status: Job["status"]) {
    const map: Record<Job["status"], string> = {
      PLANNED: "bg-amber-500/15 text-amber-500",
      IN_PROGRESS: "bg-blue-500/15 text-blue-400",
      DONE: "bg-emerald-500/15 text-emerald-400",
    } as const;
    return <span className={`px-2 py-0.5 rounded text-xs ${map[status]}`}>{status.replace("_", " ")}</span>;
  }

  async function startFromWishlist() {
    setShowWizard(true);
  }

  async function createJobs() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return setShowWizard(false);
    setBusy(true);
    try {
      const res = await fetch("/api/diy-jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vehicleId, title: "DIY Job from Wishlist", wishlist_item_ids: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create jobs");
      const newJobs: Job[] = (data.jobs || ids.map((id: string) => ({ id, title: `Job for ${id}`, status: "PLANNED" as const })))
        .map((j: any) => ({ id: j.id || crypto.randomUUID(), title: j.title || "New Job", status: j.status || "PLANNED" }));
      setJobs((prev) => [...newJobs, ...prev]);
      setShowWizard(false);
      setSelected({});
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function completeJob(id: string) {
    try {
      const res = await fetch(`/api/diy-jobs/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "DONE" }) });
      if (!res.ok) throw new Error("Failed to complete job");
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "DONE" } : j)));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">DIY Jobs</h1>
        <button className="rounded bg-primary text-primary-foreground px-4 py-2 text-sm shadow" onClick={startFromWishlist}>Start from Wishlist</button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-muted">No jobs yet.</div>
      ) : (
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li key={j.id} className="rounded border bg-card text-card-foreground p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {chip(j.status)}
                <div className="font-medium">{j.title}</div>
              </div>
              <div className="flex items-center gap-2">
                {j.status !== "DONE" && (
                  <button className="text-emerald-500 hover:underline" onClick={() => completeJob(j.id)}>Complete Job</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg rounded bg-bg border shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Start from Wishlist</div>
              <button className="text-muted hover:text-fg" onClick={() => setShowWizard(false)}>✕</button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
              {wishlist.length === 0 ? (
                <div className="text-sm text-muted">No wishlist items available.</div>
              ) : (
                wishlist.map((w) => (
                  <label key={w.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30">
                    <input type="checkbox" checked={!!selected[w.id]} onChange={(e) => setSelected((s) => ({ ...s, [w.id]: e.target.checked }))} />
                    <span className="truncate">{w.title}</span>
                  </label>
                ))
              )}
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button className="px-3 py-2 text-sm" onClick={() => setShowWizard(false)}>Cancel</button>
              <button className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50" onClick={createJobs} disabled={busy}>Create Jobs</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
