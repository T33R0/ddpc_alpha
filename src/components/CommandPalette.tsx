"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getVehicleIdFromPath } from "@/lib/vehiclePath";

export default function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [vehicles, setVehicles] = useState<Array<{ id: string; name: string }>>([]);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [inlinePicker, setInlinePicker] = useState<null | 'timeline' | 'tasks'>(null);

  const currentVehicleId = getVehicleIdFromPath(pathname) || search.get("vehicleId") || null;
  const inVehicleScoped = /^\/vehicles\//.test(pathname);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const combo = (isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k");
      if (combo) {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetch("/api/me/vehicles").then(r => r.json()).then((j) => setVehicles((j.vehicles || []).slice(0, 5))).catch(() => setVehicles([]));
    setIdx(0);
    setInlinePicker(null);
  }, [open]);

  const items = useMemo(() => {
    const base = [
      { id: "go-vehicles", label: "Go to Vehicles", action: () => router.push("/vehicles") },
      { id: "go-timeline", label: "Go to Timeline", action: () => {
        if (inVehicleScoped && currentVehicleId) router.push(`/vehicles/${currentVehicleId}/timeline`);
        else {
          setInlinePicker('timeline');
        }
      } },
      { id: "go-tasks", label: "Go to Tasks", action: () => {
        if (inVehicleScoped && currentVehicleId) router.push(`/vehicles/${currentVehicleId}/tasks`);
        else {
          setInlinePicker('tasks');
        }
      } },
      { id: "new-task", label: "New Task", action: () => {
        if (inVehicleScoped && currentVehicleId) router.push(`/vehicles/${currentVehicleId}/tasks`); else router.push("/vehicles");
      } },
      { id: "new-event", label: "New Event", action: () => {
        if (inVehicleScoped && currentVehicleId) router.push(`/vehicles/${currentVehicleId}/timeline?new=event`); else router.push("/vehicles");
      } },
    ];
    const vehEntries = vehicles.map(v => ({ id: `veh-${v.id}`, label: `Switch Vehicle: ${v.name}`, action: () => {
      if (inVehicleScoped) {
        const next = pathname.replace(/^\/vehicles\/[^\/]+/, `/vehicles/${v.id}`);
        router.push(next);
      } else if (pathname.startsWith("/timeline") || pathname.startsWith("/tasks")) {
        const params = new URLSearchParams(search?.toString());
        params.set("vehicleId", v.id);
        router.push(`${pathname}?${params.toString()}`);
      } else {
        router.push(`/vehicles/${v.id}`);
      }
    }}));
    const all = [...base, ...vehEntries];
    const q = query.trim().toLowerCase();
    return q ? all.filter(i => i.label.toLowerCase().includes(q)) : all;
  }, [vehicles, query, inVehicleScoped, currentVehicleId, pathname, router, search]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, Math.max(0, items.length - 1))); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); items[idx]?.action?.(); setOpen(false); }
  };

  return (
    <div>
      <button className="hidden" data-testid="cmdk-open" onClick={() => setOpen(true)} aria-hidden />
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/30" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-3">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a command…"
                className="w-full outline-none text-sm"
                data-testid="cmdk-input"
              />
            </div>
            {inlinePicker ? (
              <InlineVehiclePicker
                vehicles={vehicles}
                onPick={(vid) => {
                  if (inVehicleScoped) {
                    const next = pathname.replace(/^\/vehicles\/[^\/]+/, `/vehicles/${vid}`);
                    router.push(inlinePicker === 'timeline' ? `${next}/timeline` : `${next}/tasks`);
                  } else {
                    router.push(inlinePicker === 'timeline' ? `/vehicles/${vid}/timeline` : `/vehicles/${vid}/tasks`);
                  }
                  setOpen(false);
                }}
              />
            ) : (
              <div ref={listRef} className="max-h-80 overflow-auto p-1">
                {items.map((it, i) => (
                  <button
                    key={it.id}
                    onClick={() => { it.action(); }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${i === idx ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    data-testid={`cmdk-item-${it.id}`}
                  >{it.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InlineVehiclePicker({ vehicles, onPick }: { vehicles: Array<{ id: string; name: string }>; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return vehicles;
    return vehicles.filter(v => v.name.toLowerCase().includes(s));
  }, [q, vehicles]);
  return (
    <div className="p-2 space-y-2" data-testid="vehicle-picker-inline">
      <label className="text-xs text-gray-600">Pick a vehicle</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search vehicles…"
        className="w-full border rounded px-2 py-1 text-sm"
      />
      <ul className="max-h-64 overflow-auto">
        {filtered.length === 0 ? (
          <li className="text-sm text-gray-500 px-2 py-1">No matches</li>
        ) : (
          filtered.map(v => (
            <li key={v.id}>
              <button
                onClick={() => onPick(v.id)}
                className="w-full text-left px-2 py-1 rounded hover:bg-gray-50 text-sm"
              >{v.name}</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}


