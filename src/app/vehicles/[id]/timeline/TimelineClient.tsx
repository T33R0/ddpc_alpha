"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const titleRef = useRef<HTMLInputElement | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [filterLoading, setFilterLoading] = useState<boolean>(false);
  const didMount = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editType, setEditType] = useState<TimelineEvent["type"]>("SERVICE");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Initial micro-skeleton to cover first render
  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

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

  // Show a brief skeleton after filter changes
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setFilterLoading(true);
    const t = setTimeout(() => setFilterLoading(false), 250);
    return () => clearTimeout(t);
  }, [selected, from, to]);

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
    if (adding) return; // prevent duplicate submits
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
      setLiveMessage("Event added");
      // Clear live region shortly after announcement
      setTimeout(() => setLiveMessage(""), 1000);
      // Refocus title input for quick entry
      titleRef.current?.focus();
    } catch (e) {
      setData((prev) => prev.filter((x) => x.id !== temp.id));
      const msg = e instanceof Error ? e.message : "Failed to create";
      error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setData(prev => prev.filter(e => e.id !== id));
      success("Event deleted");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const isEditable = (e: TimelineEvent) => {
    const created = new Date(e.created_at).getTime();
    return Date.now() - created <= 24 * 60 * 60 * 1000;
  };

  const startEdit = (e: TimelineEvent) => {
    setEditingId(e.id);
    setEditNotes(e.notes ?? "");
    setEditType(e.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSavingId(null);
  };

  const saveEdit = async (id: string) => {
    const target = data.find(x => x.id === id);
    if (!target) return;
    if (!isEditable(target)) {
      error("Event can no longer be edited (24h window)");
      cancelEdit();
      return;
    }
    setSavingId(id);
    const prev = data;
    const nextEvent: TimelineEvent = { ...target, notes: editNotes, type: editType } as TimelineEvent;
    setData(prev => prev.map(x => (x.id === id ? nextEvent : x)));
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNotes, type: editType }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to update");
      }
      const json = await res.json();
      const updated: TimelineEvent = json.event;
      setData(prev => prev.map(x => (x.id === id ? updated : x)));
      success("Event updated");
      setEditingId(null);
    } catch (e) {
      setData(prev);
      const msg = e instanceof Error ? e.message : "Failed to update";
      error(msg);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Aria live region for screen readers */}
      <div aria-live="polite" className="sr-only">{liveMessage}</div>
      {/* Quick add */}
      <form onSubmit={handleQuickAdd} className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded p-4 bg-white" data-test="timeline-quick-add">
        <input
          name="title"
          placeholder="Quick add title"
          className="border rounded px-2 py-1 md:col-span-3"
          value={title}
          ref={titleRef}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setTitle("");
              setDate("");
              // slight delay to allow clearing
              requestAnimationFrame(() => titleRef.current?.focus());
            }
          }}
          data-test="timeline-title-input"
        />
        <input
          name="date"
          type="date"
          className="border rounded px-2 py-1 md:col-span-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button disabled={adding || !title.trim()} type="submit" className="bg-black text-white rounded px-3 py-1 disabled:opacity-50" data-test="timeline-add-btn">
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
      {(initialLoading || filterLoading) ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded p-3 bg-white animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-full bg-gray-100 rounded mb-1" />
              <div className="h-3 w-3/4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center border rounded p-12 bg-white text-gray-600">
            <div className="text-lg font-medium text-gray-800 mb-1">No events yet</div>
            <div className="text-sm mb-3">Use the quick-add form to add your first event.</div>
            <button
              type="button"
              className="text-xs px-3 py-1 border rounded bg-gray-50"
              onClick={() => titleRef.current?.focus()}
            >Add an event</button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center border rounded p-12 bg-white text-gray-600">
            <div className="text-lg font-medium text-gray-800 mb-1">No events match your filters</div>
            <div className="text-sm mb-3">Try adjusting the type or date filters.</div>
            <button
              type="button"
              className="text-xs px-3 py-1 border rounded bg-gray-50"
              onClick={() => { setSelected(new Set()); setFrom(""); setTo(""); }}
            >Clear filters</button>
          </div>
        )
      ) : (
      <div className="space-y-6">
        {groups.map(({ label, items }) => (
          <div key={label} className="space-y-3">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur px-1 py-1 text-xs font-semibold text-gray-700">{label}</div>
            {items.map((e) => (
              <div key={e.id} className="border rounded p-3 flex items-start gap-4 bg-white">
                <div className="text-xs px-2 py-0.5 rounded border bg-gray-50">{editingId === e.id ? (
                  <select
                    value={editType}
                    onChange={(ev) => setEditType(ev.target.value as TimelineEvent["type"])}
                    className="text-xs border rounded px-1 py-0.5 bg-white"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  e.type
                )}</div>
                <div className="flex-1">
                  {editingId === e.id ? (
                    <input
                      value={editNotes}
                      onChange={(ev) => setEditNotes(ev.target.value)}
                      className="text-sm border rounded px-2 py-1 w-full"
                      placeholder="Notes"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{e.notes ?? "—"}</div>
                  )}
                  <div className="text-xs text-gray-600">
                    {new Date(e.created_at).toLocaleString()} • {e.odometer ? `${e.odometer} mi` : ""} {e.cost ? `• $${e.cost.toFixed(2)}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === e.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveEdit(e.id)}
                        disabled={savingId === e.id}
                        className="text-xs text-green-700 hover:underline disabled:opacity-50"
                      >{savingId === e.id ? "Saving…" : "Save"}</button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs text-gray-600 hover:underline"
                      >Cancel</button>
                    </>
                  ) : (
                    <>
                      {isEditable(e) && (
                        <button
                          type="button"
                          onClick={() => startEdit(e)}
                          className="text-xs text-blue-600 hover:underline"
                          disabled={deletingId === e.id}
                        >Edit</button>
                      )}
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        type="button"
                        disabled={deletingId === e.id || savingId === e.id}
                      >{deletingId === e.id ? "Deleting…" : "Delete"}</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
