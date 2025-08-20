"use client";

import { useEffect, useMemo, useState } from "react";

// Simple Hunt and MarketVehicle placeholder types
type Hunt = { id: string; criteria: string[] };
type MarketVehicle = { id: string; title: string; price?: number | null; thumb?: string | null };

export default function HuntsPage() {
  const [criteriaInput, setCriteriaInput] = useState("");
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [vehicles, setVehicles] = useState<MarketVehicle[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Placeholder initial data
    setHunts([]);
    setVehicles([]);
  }, []);

  const selected = useMemo(() => vehicles.filter(v => compare.includes(v.id)).slice(0, 2), [vehicles, compare]);

  async function createHunt() {
    const tags = criteriaInput.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    if (tags.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/hunts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ criteria: tags }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create hunt");
      const h: Hunt = { id: data.id || crypto.randomUUID(), criteria: tags };
      setHunts((prev) => [h, ...prev]);
      setCriteriaInput("");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function eliminate(id: string) {
    try {
      const res = await fetch(`/api/hunts/${id}/eliminate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to eliminate");
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      setCompare((c) => c.filter((x) => x !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  function toggleCompare(id: string) {
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 2 ? [...c, id] : c));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hunts</h1>

      <div className="rounded border bg-card text-card-foreground p-4 space-y-3">
        <div className="font-medium">Create Hunt</div>
        <div className="text-sm text-muted">Enter criteria as tags (comma or space separated)</div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border bg-background px-3 py-2 text-sm"
            placeholder="e.g. AWD, 2018+, under 100k mi"
            value={criteriaInput}
            onChange={(e) => setCriteriaInput(e.target.value)}
          />
          <button className="rounded bg-primary text-primary-foreground px-4 text-sm disabled:opacity-50" onClick={createHunt} disabled={busy}>Create</button>
        </div>
        {hunts.length > 0 && (
          <div className="text-xs text-muted">Saved hunts: {hunts.map(h => h.criteria.join(" · ")).join(" | ")}</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">Results</div>
        <div className="text-sm text-muted">Compare: {selected.map(s => s.title).join(" vs ") || "—"}</div>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-muted">No saved market vehicles yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded border bg-card text-card-foreground p-3 flex flex-col gap-3">
              <div className="aspect-video rounded bg-muted overflow-hidden">
                {v.thumb ? <img src={v.thumb} alt="thumb" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-muted">No image</div>}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{v.title}</div>
                  <div className="text-xs text-muted">{v.price != null ? `$${Number(v.price).toLocaleString()}` : "—"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-rose-500 hover:underline" onClick={() => eliminate(v.id)}>Eliminate</button>
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={compare.includes(v.id)} onChange={() => toggleCompare(v.id)} disabled={!compare.includes(v.id) && compare.length >= 2} />
                    Compare
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected.length === 2 && (
        <div className="rounded border bg-card text-card-foreground p-3">
          <div className="font-medium mb-2">Compare</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selected.map((s) => (
              <div key={s.id} className="rounded border bg-background p-3">
                <div className="font-medium mb-1">{s.title}</div>
                <div className="text-xs text-muted mb-2">{s.price != null ? `$${Number(s.price).toLocaleString()}` : "—"}</div>
                {s.thumb ? <img src={s.thumb} alt="thumb" className="w-full rounded" /> : <div className="aspect-video rounded bg-muted" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
