"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createVehicle } from "./actions";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function AddVehicleModalClient() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const supabase = useMemo(() => getBrowserSupabase(), []);

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

  // Load initial lists and column mappings for resilience
  const [cols, setCols] = useState<{ year: string; make: string; model: string; trim: string; cylinders: string; displacement_l: string; transmission: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const probe = await supabase.from("vehicle_data").select("*").limit(1);
        const probeRow = Array.isArray(probe.data) && probe.data.length > 0 ? (probe.data[0] as Record<string, unknown>) : null;
        const mapping = {
          year: pickColumn(probeRow, ["year", "model_year"]) || "year",
          make: pickColumn(probeRow, ["make", "brand"]) || "make",
          model: pickColumn(probeRow, ["model"]) || "model",
          trim: pickColumn(probeRow, ["trim"]) || "trim",
          cylinders: pickColumn(probeRow, ["cylinders"]) || "cylinders",
          displacement_l: pickColumn(probeRow, ["displacement_l", "displacement", "engine_liters"]) || "displacement_l",
          transmission: pickColumn(probeRow, ["transmission", "transmission_type"]) || "transmission",
        };
        if (cancelled) return;
        setCols(mapping as typeof mapping);

        // Load distinct years (top-level choice)
        const yearsRes = await supabase
          .from("vehicle_data")
          .select(`${mapping.year}`, { count: "exact", head: false })
          .not(mapping.year, "is", null)
          .order(mapping.year, { ascending: false })
          .limit(500);
        if (cancelled) return;
        const yearRows = (yearsRes.data as unknown as Array<Record<string, string | number>> | null) ?? [];
        const yrs = Array.from(new Set(yearRows.map(v => String(v[mapping.year as keyof typeof v])))).filter(Boolean);
        setYears(yrs);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  // Load makes when year selected
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cols || !year) { setMakes([]); return; }
      try {
        const { data } = await supabase
          .from("vehicle_data")
          .select(`${cols.make}`)
          .eq(cols.year, year)
          .not(cols.make, "is", null)
          .order(cols.make, { ascending: true })
          .limit(500);
        if (cancelled) return;
        const makeRows = (data as unknown as Array<Record<string, string>> | null) ?? [];
        const mks = Array.from(new Set(makeRows.map(v => String(v[cols.make as keyof typeof v])))).filter(Boolean);
        setMakes(mks);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [cols, supabase, year]);

  // When year changes, reset downstream and load models and trims after make chosen
  useEffect(() => { setMake(""); setModel(""); setTrim(""); setModels([]); setTrims([]); }, [year]);
  useEffect(() => { setModel(""); setTrim(""); setModels([]); setTrims([]); }, [make]);
  useEffect(() => { setTrim(""); setTrims([]); }, [model]);

  // Load models when both year and make selected
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cols || !year || !make) return;
      try {
        const { data } = await supabase
          .from("vehicle_data")
          .select(`${cols.model}`)
          .eq(cols.year, year)
          .eq(cols.make, make)
          .not(cols.model, "is", null)
          .order(cols.model, { ascending: true })
          .limit(500);
        if (cancelled) return;
        const modelRows = (data as unknown as Array<Record<string, string>> | null) ?? [];
        const mdls = Array.from(new Set(modelRows.map(v => String(v[cols.model as keyof typeof v])))).filter(Boolean);
        setModels(mdls);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [cols, supabase, year, make]);

  // Load trims when year+make+model selected
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cols || !year || !make || !model) return;
      try {
        const { data } = await supabase
          .from("vehicle_data")
          .select(`${cols.trim}`)
          .eq(cols.year, year)
          .eq(cols.make, make)
          .eq(cols.model, model)
          .not(cols.trim, "is", null)
          .order(cols.trim, { ascending: true })
          .limit(500);
        if (cancelled) return;
        const trimRows = (data as unknown as Array<Record<string, string>> | null) ?? [];
        const tr = Array.from(new Set(trimRows.map(v => String(v[cols.trim as keyof typeof v])))).filter(Boolean);
        setTrims(tr);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [cols, supabase, year, make, model]);

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
              className="grid grid-cols-1 md:grid-cols-6 gap-3"
            >
              <input name="vin" placeholder="VIN" className="border rounded px-2 py-1 md:col-span-2 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />

              <select
                name="year"
                className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              >
                <option value="" disabled>Select year</option>
                {years.map((y) => (<option key={`y-${y}`} value={y}>{y}</option>))}
              </select>

              <select
                name="make"
                className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                disabled={!year}
                required
              >
                <option value="" disabled>{year ? "Select make" : "Select year first"}</option>
                {makes.map((m) => (<option key={`mk-${m}`} value={m}>{m}</option>))}
              </select>

              <select
                name="model"
                className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={!year || !make}
                required
              >
                <option value="" disabled>{make ? "Select model" : "Select make first"}</option>
                {models.map((m) => (<option key={`md-${m}`} value={m}>{m}</option>))}
              </select>

              <select
                name="trim"
                className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                value={trim}
                onChange={(e) => setTrim(e.target.value)}
                disabled={!year || !make || !model}
              >
                <option value="">{model ? "Optional: trim" : "Select model first"}</option>
                {trims.map((t) => (<option key={`tr-${t}`} value={t}>{t}</option>))}
              </select>

              <input name="nickname" placeholder="Nickname" className="border rounded px-2 py-1 md:col-span-2 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />

              {/* Optional dependent specs */}
              <select
                name="cylinders"
                className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                value={cylinders}
                onChange={(e) => setCylinders(e.target.value)}
                disabled={!year || !make || !model}
              >
                <option value="">Optional: cylinders</option>
                {["2","3","4","5","6","8","10","12","16"].map((c) => (<option key={`cyl-${c}`} value={c}>{c}</option>))}
              </select>

              <input
                name="displacement_l"
                placeholder="Engine size (L)"
                className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                value={displacement}
                onChange={(e) => setDisplacement(e.target.value)}
                disabled={!year || !make || !model}
                inputMode="decimal"
              />

              <input
                name="transmission"
                placeholder="Transmission"
                className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                disabled={!year || !make || !model}
                list="transmission-options"
              />
              <datalist id="transmission-options">
                <option value="Manual" />
                <option value="Automatic" />
                <option value="Dual-clutch" />
                <option value="CVT" />
              </datalist>

              <select name="privacy" className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </select>

              <div className="md:col-span-2 flex items-center gap-2">
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


