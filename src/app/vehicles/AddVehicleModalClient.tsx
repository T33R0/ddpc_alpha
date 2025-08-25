"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createVehicle } from "./actions";
// Switch to server-backed API for options to avoid client Supabase wiring issues
import { Car, Plus } from "lucide-react";

export default function AddVehicleModalClient() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Progressive selectors
  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [year, setYear] = useState<string>("");
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");

  // No optional specs in this modal; collected on next page

  // Open if URL has ?new=1
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("new") === "1") setOpen(true);
    } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const onClose = () => setOpen(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to pick dynamic column names from probe row
  function pickColumn(row: Record<string, unknown> | null, candidates: string[]): string | null {
    if (!row) return candidates[0] ?? null;
    for (const c of candidates) { if (c in row) return c; }
    return null;
  }

  // Load years from server API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/vehicle-data/options?scope=years", { cache: "no-store" });
        const json = (await res.json()) as { values: string[] };
        if (cancelled) return;
        setYears(json.values || []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Load makes when year selected
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!year) { setMakes([]); return; }
      try {
        const res = await fetch(`/api/vehicle-data/options?scope=makes&year=${encodeURIComponent(year)}`, { cache: "no-store" });
        const json = (await res.json()) as { values: string[] };
        if (cancelled) return;
        setMakes(json.values || []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [year]);

  // When year changes, reset downstream and load models and trims after make chosen
  useEffect(() => { setMake(""); setModel(""); setModels([]); }, [year]);
  useEffect(() => { setModel(""); setModels([]); }, [make]);

  // Load models when both year and make selected
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!year || !make) return;
      try {
        const res = await fetch(`/api/vehicle-data/options?scope=models&year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`, { cache: "no-store" });
        const json = (await res.json()) as { values: string[] };
        if (cancelled) return;
        setModels(json.values || []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [year, make]);

  // No trim loading; collected on next page

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        className="text-sm px-3 py-1 rounded bg-brand text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] inline-flex items-center justify-center transition hover:brightness-95 active:brightness-90"
        onClick={() => setOpen(true)}
        data-testid="btn-new-vehicle"
        aria-label="Add vehicle"
        title="Add vehicle"
      >
        <span className="relative inline-flex items-center justify-center">
          <Car className="w-5 h-5" />
          <Plus className="w-3 h-3 absolute -right-1 -top-1" />
        </span>
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-vehicle-title" ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-bg/60" onClick={onClose} />
          <div className="relative w-[92%] max-w-2xl rounded-lg border bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 id="add-vehicle-title" className="text-lg font-semibold">Add Vehicle</h2>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                const vinVal = (fd.get("vin")?.toString() || "").trim();
                const y = fd.get("year")?.toString() || "";
                const mk = fd.get("make")?.toString() || "";
                const md = fd.get("model")?.toString() || "";
                if (!vinVal && !(y && mk && md)) {
                  setError("Enter a VIN or select Year, Make, and Model.");
                  return;
                }
                try {
                  setSubmitting(true);
                  const res = await createVehicle(fd);
                  setOpen(false);
                  router.push(`/vehicles/${res.id}`);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to add vehicle");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="mb-1 block text-sm text-muted">VIN:</label>
                <input name="vin" placeholder="Enter VIN (optional)" className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
              </div>

              <div className="relative text-center text-xs uppercase text-muted select-none">
                <span className="px-2 bg-card relative z-10">OR</span>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border" aria-hidden="true" />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Year</label>
                <select
                  name="year"
                  className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="" disabled>Select year</option>
                  {years.map((y) => (<option key={`y-${y}`} value={y}>{y}</option>))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Make</label>
                <select
                  name="make"
                  className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  disabled={!year}
                >
                  <option value="" disabled>{year ? "Select make" : "Select year first"}</option>
                  {makes.map((m) => (<option key={`mk-${m}`} value={m}>{m}</option>))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Model</label>
                <select
                  name="model"
                  className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={!year || !make}
                >
                  <option value="" disabled>{make ? "Select model" : "Select make first"}</option>
                  {models.map((m) => (<option key={`md-${m}`} value={m}>{m}</option>))}
                </select>
              </div>

              {/* Only Y/M/M here; other attributes collected on the details page */}

              {error && <div className="text-sm text-red-600" role="alert">{error}</div>}

              <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                <button type="button" className="border rounded px-3 py-1 bg-bg text-fg" onClick={onClose} disabled={submitting}>Cancel</button>
                <button type="submit" className="bg-brand text-white rounded px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


