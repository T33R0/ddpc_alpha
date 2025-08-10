"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getVehicleIdFromPath } from "@/lib/vehiclePath";

type V = { id: string; name: string; privacy?: string };

export default function VehicleSwitcher() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [vehicles, setVehicles] = useState<V[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentVehicleId = getVehicleIdFromPath(pathname) || search.get("vehicleId") || null;
  const inVehicleScoped = /^\/vehicles\//.test(pathname);

  useEffect(() => {
    if (!open) return;
    fetch("/api/me/vehicles").then(r => r.json()).then((j) => setVehicles(j.vehicles || [])).catch(() => setVehicles([]));
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(v => v.name.toLowerCase().includes(q));
  }, [vehicles, query]);

  const onSelect = (id: string) => {
    setOpen(false);
    // Determine destination based on current route
    if (inVehicleScoped) {
      // Replace the vehicle id segment
      const next = pathname.replace(/^\/vehicles\/[^\/]+/, `/vehicles/${id}`);
      router.push(next);
      return;
    }
    if (pathname.startsWith("/timeline") || pathname.startsWith("/tasks")) {
      // Combined pages use query param
      const params = new URLSearchParams(search?.toString());
      params.set("vehicleId", id);
      router.push(`${pathname}?${params.toString()}`);
      return;
    }
    // Fallback: go to details
    router.push(`/vehicles/${id}`);
  };

  const onClear = () => {
    setOpen(false);
    if (inVehicleScoped) {
      router.push(`/vehicles`);
      return;
    }
    if (pathname.startsWith("/timeline") || pathname.startsWith("/tasks")) {
      const params = new URLSearchParams(search?.toString());
      params.delete("vehicleId");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
      return;
    }
  };

  const label = useMemo(() => {
    if (!currentVehicleId) return "All vehicles";
    const found = vehicles.find(v => v.id === currentVehicleId);
    return found?.name || "Current vehicle";
  }, [currentVehicleId, vehicles]);

  return (
    <div className="relative">
      <button
        className="text-sm px-2 py-1 rounded border bg-white hover:bg-gray-50 inline-flex items-center gap-1"
        onClick={() => setOpen(o => !o)}
        data-testid="vehicle-switcher"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate max-w-[12ch]" title={label}>{label}</span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div role="dialog" aria-modal="true" className="absolute right-0 mt-2 w-72 rounded border bg-white shadow-md p-2 z-50">
          <div className="flex items-center gap-2 mb-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vehicles…"
              className="w-full border rounded px-2 py-1 text-sm"
              data-testid="vehicle-switcher-input"
            />
            <button className="text-xs px-2 py-1 border rounded bg-gray-50" onClick={onClear}>Clear</button>
          </div>
          <ul className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <li className="text-sm text-gray-500 px-2 py-1">No matches</li>
            ) : (
              filtered.map(v => (
                <li key={v.id}>
                  <button
                    onClick={() => onSelect(v.id)}
                    className="w-full text-left px-2 py-1 rounded hover:bg-gray-50 text-sm"
                    data-testid="vehicle-switcher-item"
                  >{v.name}</button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}


