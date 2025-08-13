"use client";

import { useEffect, useMemo, useState } from "react";

type PartRow = {
  id: string;
  type: string; // Column A (locked)
  brand: string; // Column B (editable)
  installed_at: string; // Column C (date string)
  price: string; // Column D (string to keep currency flexible)
};

const DEFAULT_PART_TYPES: string[] = [
  "Air filter",
  "Alternator",
  "Battery",
  "Boost controller",
  "Brake pads",
  "Brake rotors",
  "Camshaft",
  "Clutch",
  "Coilovers",
  "Control arms",
  "Differential",
  "Driveshaft",
  "ECU",
  "Exhaust (cat‑back)",
  "Exhaust manifold",
  "Fuel injectors",
  "Fuel pump",
  "Head gasket",
  "Header(s)",
  "Intercooler",
  "Oil cooler",
  "Pistons",
  "Radiator",
  "Shifter",
  "Spark plugs",
  "Springs",
  "Struts/Shocks",
  "Sway bar",
  "Throttle body",
  "Tie rod",
  "Turbocharger",
  "Water pump",
  "Wheels",
];

export default function PartsManagerCard({ vehicleId }: { vehicleId: string }) {
  const [rows, setRows] = useState<PartRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // Available list excludes already-selected in modal and already-created rows
  const taken = useMemo(() => new Set<string>([...selected, ...rows.map((r) => r.type)]), [selected, rows]);
  const available = useMemo(() => DEFAULT_PART_TYPES.filter((t) => !taken.has(t)), [taken]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen && e.key === "Escape") {
        setModalOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const addSelectedToRows = () => {
    const newRows: PartRow[] = selected.map((t) => ({ id: crypto.randomUUID(), type: t, brand: "", installed_at: "", price: "" }));
    setRows((prev) => [...prev, ...newRows]);
    setSelected([]);
    setModalOpen(false);
  };

  const updateField = (id: string, key: keyof PartRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-5 md:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <div className="text-base font-semibold">Installed parts</div>
        <button type="button" className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50" onClick={() => setModalOpen(true)}>
          Add parts
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2 pr-4">Part</th>
              <th className="py-2 pr-4">Brand</th>
              <th className="py-2 pr-4">Installed</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2" aria-label="row actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 text-gray-600" colSpan={5}>No parts yet. Click “Add parts”.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b last:border-none">
                  <td className="py-2 pr-4 font-medium">{r.type}</td>
                  <td className="py-2 pr-4">
                    <input value={r.brand} onChange={(e) => updateField(r.id, "brand", e.target.value)} className="w-full rounded border px-2 py-1" placeholder="e.g., Bosch" />
                  </td>
                  <td className="py-2 pr-4">
                    <input type="date" value={r.installed_at} onChange={(e) => updateField(r.id, "installed_at", e.target.value)} className="w-full rounded border px-2 py-1" />
                  </td>
                  <td className="py-2 pr-4">
                    <input value={r.price} onChange={(e) => updateField(r.id, "price", e.target.value)} className="w-full rounded border px-2 py-1" placeholder="$0.00" />
                  </td>
                  <td className="py-2">
                    <button type="button" className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50" onClick={() => removeRow(r.id)}>Remove</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl border shadow-lg w-[92%] max-w-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-semibold">Add parts</div>
              <div className="flex items-center gap-2">
                <button type="button" className="text-sm px-3 py-1.5 rounded border bg-white hover:bg-gray-50" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="button" className="text-sm px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-black" onClick={addSelectedToRows}>Save</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border">
                <div className="px-3 py-2 text-sm font-medium border-b">Selected</div>
                <ul className="max-h-72 overflow-auto divide-y">
                  {selected.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-gray-600">Nothing selected yet.</li>
                  ) : (
                    selected.map((t) => (
                      <li key={t} className="px-3 py-2 text-sm flex items-center justify-between">
                        <span>{t}</span>
                        <button type="button" className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50" onClick={() => setSelected((prev) => prev.filter((x) => x !== t))}>Remove</button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="rounded-lg border">
                <div className="px-3 py-2 text-sm font-medium border-b">Available parts</div>
                <ul className="max-h-72 overflow-auto divide-y">
                  {available.map((t) => (
                    <li key={t} className="px-3 py-2 text-sm flex items-center justify-between">
                      <span>{t}</span>
                      <button type="button" className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50" onClick={() => setSelected((prev) => [...prev, t])}>Add</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-600">Pick one or more parts from the right. They move into the selected list. Save to insert them into the table where you can fill brand, install date, and price.</p>
          </div>
        </div>
      )}
    </div>
  );
}


