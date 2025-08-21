"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { isEnabled } from "@/lib/featureFlags";
import { makeOptimisticMergeEvent } from "@/lib/timeline/makeOptimisticMergeEvent";
import { QuickAddEventForm } from "@/components/event/QuickAddEventForm";
import type { EventType as ManualEventType } from "@/types/event-types";
import EventList from "@/components/timeline/EventList";

type TimelineEventType = "MERGE" | "SERVICE" | "MOD" | "DYNO" | "NOTE";

export type TimelineEvent = {
  id: string;
  vehicle_id: string;
  type: TimelineEventType;
  title?: string | null;
  notes?: string | null;
  display_type?: string | null;
  display_icon?: string | null;
  display_color?: string | null;
  display_label?: string | null;
  occurred_at: string; // ISO
  occurred_on?: string | null;
  date_confidence?: "exact" | "approximate" | "unknown";
  task_id?: string; // optional link to originating task
  optimistic?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type MergeDetail = {
  vehicle_id: string;
  from_plan_id: string;
  to_plan_id: string;
  title?: string;
  notes?: string;
  occurred_at?: string;
};

const TYPES: TimelineEventType[] = ["SERVICE", "MOD", "DYNO", "NOTE"];

export default function TimelineClient({ events, vehicleId, canWrite = true, eventTypes = [] as ManualEventType[] }: { events: TimelineEvent[]; vehicleId: string; canWrite?: boolean; eventTypes?: ManualEventType[] }) {
  const [data, setData] = useState<TimelineEvent[]>(events as TimelineEvent[]);
  const { success, error } = useToast();
  // Removed type checkbox filtering; keep empty set for compatibility
  const [selected] = useState<Set<TimelineEvent["type"]>>(new Set());
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [filterLoading, setFilterLoading] = useState<boolean>(false);
  const didMount = useRef(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState<boolean>(false);

  // Listen for merge-plan optimistic signal
  useEffect(() => {
    try {
      if (!isEnabled("ENABLE_PLAN_MERGE")) return;
    } catch {
      return;
    }
    const onMergeCreated = (ev: Event) => {
      const e = ev as CustomEvent<MergeDetail>;
      if (!e.detail || e.detail.vehicle_id !== vehicleId) return;
      const optimistic = makeOptimisticMergeEvent(e.detail);
      setData(prev => [optimistic as TimelineEvent, ...prev]);
    };
    window.addEventListener("plan-merge-created", onMergeCreated as EventListener);
    return () => window.removeEventListener("plan-merge-created", onMergeCreated as EventListener);
  }, [vehicleId]);

  // Initial micro-skeleton to cover first render; also refresh from server to ensure fresh data when navigating back
  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 200);
    // Fetch latest events for this vehicle to avoid stale SSR data
    fetch(`/api/vehicles/${vehicleId}/timeline`).then(r => r.json()).then((j) => {
      if (Array.isArray(j.events)) {
        // Normalize API (enriched) payload to TimelineEvent shape expected by client
        const normalized: TimelineEvent[] = (j.events as Array<{ id: string; vehicle_id: string; db_type?: string; title?: string | null; notes?: string | null; display_type?: string | null; display_icon?: string | null; display_color?: string | null; display_label?: string | null; occurred_at?: string | null; occurred_on?: string | null; date_confidence?: string | null; created_at?: string | null; updated_at?: string | null }>).map((e) => ({
          id: e.id,
          vehicle_id: e.vehicle_id,
          // Keep NOTE as default for filters; detailed display handled by display_* fields
          type: (e.db_type === 'SERVICE' ? 'SERVICE' : e.db_type === 'INSTALL' ? 'MOD' : e.db_type === 'DYNO' ? 'DYNO' : 'NOTE') as TimelineEventType,
          title: e.title ?? null,
          notes: e.notes ?? null,
          display_type: (e as unknown as { display_type?: string | null }).display_type ?? null,
          display_icon: (e as unknown as { display_icon?: string | null }).display_icon ?? null,
          display_color: (e as unknown as { display_color?: string | null }).display_color ?? null,
          display_label: (e as unknown as { display_label?: string | null }).display_label ?? null,
          occurred_at: (e.occurred_at ?? e.created_at ?? new Date().toISOString()),
          occurred_on: e.occurred_on ?? (e.occurred_at ? e.occurred_at.slice(0,10) : (e.created_at ? e.created_at.slice(0,10) : null)),
          date_confidence: (e.date_confidence === 'approximate' || e.date_confidence === 'unknown') ? e.date_confidence : 'exact',
          created_at: e.created_at ?? null,
          updated_at: e.updated_at ?? null,
        }));
        setData(normalized);
      }
    }).catch(() => void 0);
    return () => clearTimeout(t);
  }, [vehicleId]);

  // Open modal if URL contains ?new=event, then clean the URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "event") {
        setNewOpen(true);
        params.delete("new");
        const url = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
        window.history.replaceState({}, "", url);
      }
    } catch {}
  }, []);

  // Note: type checkbox filters removed; keep function stub minimal (unused)

  const filtered = useMemo(() => {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    return data.filter((e) => {
      if (selected.size > 0 && !selected.has(e.type)) return false;
      const d = new Date(e.occurred_at);
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
      const d = new Date(e.occurred_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) {
        const label = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
        map.set(key, { label, items: [] });
      }
      map.get(key)!.items.push(e);
    }
    return Array.from(map.values());
  }, [filtered]);

  // handleQuickAdd removed (replaced by QuickAddEventForm)

  const handleDelete = async (id: string) => {
    if (!canWrite) return;
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

  const isEditable = (_e: TimelineEvent) => true;

  const handleEdit = async (id: string) => {
    const target = data.find(x => x.id === id);
    if (!target) return;
    const nextNotes = window.prompt("Edit notes", target.notes ?? "");
    if (nextNotes == null) return;
    setSavingId(id);
    const prev = data;
    const optimistic: TimelineEvent = { ...target, notes: nextNotes } as TimelineEvent;
    setData(prev => prev.map(x => (x.id === id ? optimistic : x)));
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: nextNotes }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to update");
      }
      const json = await res.json();
      const updated: TimelineEvent = json.event;
      setData(prev => prev.map(x => (x.id === id ? updated : x)));
      success("Event updated");
    } catch (e) {
      setData(prev);
      const msg = e instanceof Error ? e.message : "Failed to update";
      error(msg);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
    <div className="space-y-4">
      {/* Aria live region for screen readers (removed as we no longer set messages locally) */}
      <div aria-live="polite" className="sr-only" />
      {/* New Event trigger */}
      <div className="flex justify-end">
        <button type="button" onClick={() => setNewOpen(true)} className="bg-brand text-white rounded px-3 py-1">New Event</button>
      </div>

      {/* Modal: Quick add */}
      {newOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNewOpen(false)}>
          <div className="w-full max-w-3xl rounded bg-bg p-4 border border-[color:var(--border)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-fg">New Event</h2>
              <button type="button" onClick={() => setNewOpen(false)} className="text-sm text-muted">Close</button>
            </div>
            <QuickAddEventForm
              vehicleId={vehicleId}
              eventTypes={eventTypes}
              defaultDate={new Date().toISOString().slice(0,10)}
              onCreated={(ev) => {
                const created: TimelineEvent = {
                  id: ev.id,
                  vehicle_id: ev.vehicle_id,
                  type: (ev.type as TimelineEventType) || "NOTE",
                  display_type: (ev as unknown as { manualTypeKey?: string | null }).manualTypeKey ?? null,
                  display_icon: (ev as unknown as { icon?: string | null }).icon ?? null,
                  display_color: (ev as unknown as { color?: string | null }).color ?? null,
                  display_label: (ev as unknown as { label?: string | null }).label ?? null,
                  title: ev.title ?? null,
                  notes: (ev as unknown as { notes?: string | null }).notes ?? (ev.title ?? null),
                  occurred_at: (ev as unknown as { occurred_at?: string | null }).occurred_at ?? new Date().toISOString(),
                  occurred_on: (ev as unknown as { occurred_on?: string | null }).occurred_on ?? null,
                  date_confidence: (ev as unknown as { date_confidence?: "exact"|"approximate"|"unknown" }).date_confidence ?? "exact",
                  created_at: (ev as unknown as { occurred_at?: string | null }).occurred_at ?? null,
                } as TimelineEvent;
                setData(prev => [created, ...prev]);
              }}
              onSuccess={() => setNewOpen(false)}
            />
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="rounded border p-3 bg-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="ml-auto flex items-center gap-2 text-xs">
            <label className="text-muted">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1 bg-bg text-fg" />
            <label className="text-muted">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1 bg-bg text-fg" />
          </div>
        </div>
      </div>

      {/* Grouped list */}
      {(initialLoading || filterLoading) ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded p-3 bg-card animate-pulse">
              <div className="h-4 w-24 bg-[color:var(--border)] rounded mb-2" />
              <div className="h-3 w-full bg-[color:var(--border)]/60 rounded mb-1" />
              <div className="h-3 w-3/4 bg-[color:var(--border)]/60 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center border rounded p-12 bg-card text-muted">
            <div className="text-lg font-medium text-fg mb-1">No events yet</div>
            <div className="text-sm mb-3">Click New Event to add your first event.</div>
            <button
              type="button"
              className="text-xs px-3 py-1 border rounded bg-bg text-fg"
              onClick={() => setNewOpen(true)}
            >New Event</button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center border rounded p-12 bg-card text-muted">
            <div className="text-lg font-medium text-fg mb-1">No events match your filters</div>
            <div className="text-sm mb-3">Try adjusting the date filters.</div>
            <button
              type="button"
              className="text-xs px-3 py-1 border rounded bg-bg text-fg"
              onClick={() => { setFrom(""); setTo(""); }}
            >Clear filters</button>
          </div>
        )
      ) : (
      <div className="space-y-6">
        {groups.map(({ label, items }) => {
          const cards = items.map((e) => ({
            id: e.id,
            type: e.display_type ?? null,
            icon: e.display_icon ?? null,
            color: e.display_color ?? null,
            label: e.display_label ?? null,
            title: e.title ?? null,
            description: e.notes ?? null,
            occurred_at: e.occurred_at ?? null,
            occurred_on: e.occurred_on ?? (e.occurred_at ? e.occurred_at.slice(0,10) : null),
            date_confidence: e.date_confidence ?? (e.occurred_at ? "exact" : "unknown"),
          }));
          return (
            <div key={label} className="space-y-3">
              <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur px-1 py-1 text-xs font-semibold text-muted">{label}</div>
              <EventList
                events={cards}
                onEdit={(id) => { if (!canWrite) return; handleEdit(id); }}
                onDelete={(id) => { if (!canWrite) return; setConfirmingDeleteId(id); }}
              />
            </div>
          );
        })}
      </div>
      )}
    </div>
    {Boolean(confirmingDeleteId) && (
      <ConfirmDialog
        open={true}
        title="Delete event?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setConfirmingDeleteId(null)}
        onConfirm={async () => { if (confirmingDeleteId) { const id = confirmingDeleteId; setConfirmingDeleteId(null); await handleDelete(id); } }}
        dataTest="timeline-delete-confirm"
      />
    )}
    </>
  );
}
