"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createVehicle } from "./actions";
// Switch to server-backed API for options to avoid client Supabase wiring issues

export default function AddVehicleModalClient() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Progressive selectors
  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);

  const [year, setYear] = useState<string>("");
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [trim, setTrim] = useState<string>("");

  // Optional specs
  const [cylinders, setCylinders] = useState<string>("");
  const [displacement, setDisplacement] = useState<string>("");
  const [transmission, setTransmission] = useState<string>("");

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
  useEffect(() => { setMake(""); setModel(""); setTrim(""); setModels([]); setTrims([]); }, [year]);
  useEffect(() => { setModel(""); setTrim(""); setModels([]); setTrims([]); }, [make]);
  useEffect(() => { setTrim(""); setTrims([]); }, [model]);

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

  // Load trims when year+make+model selected
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!year || !make || !model) return;
      try {
        const res = await fetch(`/api/vehicle-data/options?scope=trims&year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`, { cache: "no-store" });
        const json = (await res.json()) as { values: string[] };
        if (cancelled) return;
        setTrims(json.values || []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [year, make, model]);

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        className="text-sm px-3 py-1 rounded bg-brand text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
        onClick={() => setOpen(true)}
        data-testid="btn-new-vehicle"
      >
        Add Vehicle
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-vehicle-title" ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-bg/60" onClick={onClose} />
          <div className="relative w-[92%] max-w-2xl rounded-lg border bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 id="add-vehicle-title" className="text-lg font-semibold">Add Vehicle</h2>
              <button type="button" className="text-sm text-muted hover:underline" onClick={onClose}>Close</button>
            </div>
            <form
              action={async (fd) => {
                // Required enforced via disabled state + required attrs
                await createVehicle(fd);
                setOpen(false);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted">VIN</label>
                <input name="vin" placeholder="Optional VIN" className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Year</label>
                <select
                  name="year"
                  className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
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
                  required
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
                  required
                >
                  <option value="" disabled>{make ? "Select model" : "Select make first"}</option>
                  {models.map((m) => (<option key={`md-${m}`} value={m}>{m}</option>))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Trim</label>
                <select
                  name="trim"
                  className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  value={trim}
                  onChange={(e) => setTrim(e.target.value)}
                  disabled={!year || !make || !model}
                >
                  <option value="">{model ? "Optional: trim" : "Select model first"}</option>
                  {trims.map((t) => (<option key={`tr-${t}`} value={t}>{t}</option>))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted">Nickname</label>
                <input name="nickname" placeholder="Optional nickname" className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
              </div>

              {/* Optional dependent specs */}
              <div>
                <label className="mb-1 block text-sm text-muted">Cylinders</label>
                <select
                  name="cylinders"
                  className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  value={cylinders}
                  onChange={(e) => setCylinders(e.target.value)}
                  disabled={!year || !make || !model}
                >
                  <option value="">Optional</option>
                  {["2","3","4","5","6","8","10","12","16"].map((c) => (<option key={`cyl-${c}`} value={c}>{c}</option>))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Engine size (L)</label>
                <input
                  name="displacement_l"
                  placeholder="Optional"
                  className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  value={displacement}
                  onChange={(e) => setDisplacement(e.target.value)}
                  disabled={!year || !make || !model}
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">Transmission</label>
                <input
                  name="transmission"
                  placeholder="Optional"
                  className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  disabled={!year || !make || !model}
                  list="transmission-options"
                />
              </div>
              <datalist id="transmission-options">
                <option value="Manual" />
                <option value="Automatic" />
                <option value="Dual-clutch" />
                <option value="CVT" />
              </datalist>

              <div>
                <label className="mb-1 block text-sm text-muted">Privacy</label>
                <select name="privacy" className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                <button type="button" className="border rounded px-3 py-1 bg-bg text-fg" onClick={onClose}>Cancel</button>
                <button type="submit" className="bg-brand text-white rounded px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">Add Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


