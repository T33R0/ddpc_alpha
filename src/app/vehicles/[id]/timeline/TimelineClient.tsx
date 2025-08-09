"use client";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

const TYPES = ["SERVICE","INSTALL","INSPECT","TUNE"] as const;

export type TimelineEvent = { id: string; type: typeof TYPES[number]; odometer: number | null; cost: number | null; notes: string | null; created_at: string };

export default function TimelineClient({ events, vehicleId }: { events: TimelineEvent[]; vehicleId: string }) {
  const [data, setData] = useState<TimelineEvent[]>(events);
  const { success, error } = useToast();
  const [selected, setSelected] = useState<Set<TimelineEvent["type"]>>(new Set());
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);

  const toggleType = (t: TimelineEvent["type"]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    return data.filter((e) => {
      if (selected.size > 0 && !selected.has(e.type)) return false;
      const d = new Date(e.created_at);
      if (fromDate && d < fromDate) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [data, selected, from, to]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: TimelineEvent[] }>();
    for (const e of filtered) {
      const d = new Date(e.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) {
        const label = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
        map.set(key, { label, items: [] });
      }
      map.get(key)!.items.push(e);
    }
    return Array.from(map.values());
  }, [filtered]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      error("Title is required");
      return;
    }
    setAdding(true);
    const nowIso = new Date().toISOString();
    const created_at = date ? new Date(date).toISOString() : nowIso;
    const temp: TimelineEvent = {
      id: `tmp-${Date.now()}`,
      type: "SERVICE",
      odometer: null,
      cost: null,
      notes: trimmed,
      created_at,
    } as TimelineEvent;
    setData((prev) => [temp, ...prev]);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, title: trimmed, date: date || undefined }),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || "Failed to create");
      }
      const json = await res.json();
      const created: TimelineEvent = json.event;
      setData((prev) => [created, ...prev.filter((x) => x.id !== temp.id)]);
      setTitle("");
      setDate("");
      success("Event added");
    } catch (e) {
      setData((prev) => prev.filter((x) => x.id !== temp.id));
      const msg = e instanceof Error ? e.message : "Failed to create";
      error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setData(prev => prev.filter(e => e.id !== id));
      success("Event deleted");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      error(msg);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick add */}
      <form onSubmit={handleQuickAdd} className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded p-4 bg-white">
        <input
          name="title"
          placeholder="Quick add title"
          className="border rounded px-2 py-1 md:col-span-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          name="date"
          type="date"
          className="border rounded px-2 py-1 md:col-span-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button disabled={adding || !title.trim()} type="submit" className="bg-black text-white rounded px-3 py-1 disabled:opacity-50">
          {adding ? "Adding…" : "Add"}
        </button>
      </form>
      {/* Filters */}
      <div className="rounded border p-3 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {TYPES.map((t) => (
              <label key={t} className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-black"
                  checked={selected.has(t)}
                  onChange={() => toggleType(t)}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <label className="text-gray-600">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1" />
            <label className="text-gray-600">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1" />
          </div>
        </div>
      </div>

      {/* Grouped list */}
      <div className="space-y-6">
        {groups.map(({ label, items }) => (
          <div key={label} className="space-y-3">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur px-1 py-1 text-xs font-semibold text-gray-700">{label}</div>
            {items.map((e) => (
              <div key={e.id} className="border rounded p-3 flex items-start gap-4 bg-white">
                <div className="text-xs px-2 py-0.5 rounded border bg-gray-50">{e.type}</div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{e.notes ?? "—"}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(e.created_at).toLocaleString()} • {e.odometer ? `${e.odometer} mi` : ""} {e.cost ? `• $${e.cost.toFixed(2)}` : ""}
                  </div>
                </div>
                <button onClick={() => handleDelete(e.id)} className="text-xs text-red-600 hover:underline" type="button">Delete</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
