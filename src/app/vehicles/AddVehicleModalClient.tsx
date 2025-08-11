"use client";
import { useEffect, useRef, useState } from "react";
import { createVehicle } from "./actions";

export default function AddVehicleModalClient() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        className="text-sm px-3 py-1 rounded bg-brand text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
        onClick={() => setOpen(true)}
        data-testid="btn-new-vehicle"
      >
        New Vehicle
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-vehicle-title" ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-bg/60" onClick={onClose} />
          <div className="relative w-[92%] max-w-2xl rounded-lg border bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 id="add-vehicle-title" className="text-lg font-semibold">Add Vehicle</h2>
              <button type="button" className="text-sm text-muted hover:underline" onClick={onClose}>Close</button>
            </div>
            <form action={createVehicle} className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <input name="vin" placeholder="VIN" className="border rounded px-2 py-1 md:col-span-2 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
              <input name="year" placeholder="Year" type="number" className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
              <input name="make" placeholder="Make" className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" required />
              <input name="model" placeholder="Model" className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" required />
              <input name="trim" placeholder="Trim" className="border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
              <input name="nickname" placeholder="Nickname" className="border rounded px-2 py-1 md:col-span-2 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
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


