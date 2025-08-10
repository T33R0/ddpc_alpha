"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { isEnabled } from "@/lib/featureFlags";

type Plan = { id: string; name: string };

export default function MergePlansModal({
  open,
  onClose,
  vehicleId,
  plans,
}: {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  plans: Plan[];
}) {
  const { success, error } = useToast();
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setFromId("");
      setToId("");
      setTitle("");
      setNotes("");
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const distinct = fromId && toId && fromId !== toId;

  async function onSave() {
    if (!distinct) return;
    const flag = isEnabled("NEXT_PUBLIC_ENABLE_PLAN_MERGE");
    if (!flag) {
      error("Not yet wired");
      onClose();
      return;
    }
    try {
      const res = await fetch("/api/events/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, from_plan_id: fromId, to_plan_id: toId, title: title || undefined, notes: notes || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to create merge event");
      }
      success("Merge event created");
      onClose();
      // Optimistic signal: consumers can listen to a custom event to inject into timeline
      try {
        document.dispatchEvent(new CustomEvent("plan-merge-created", { detail: { vehicleId, fromId, toId, title, notes } }));
      } catch {}
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to merge");
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="merge-plans-title" ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-bg/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border bg-card p-4 shadow-lg">
        <div className="mb-3">
          <h2 id="merge-plans-title" className="text-lg font-semibold">Merge Plans</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted">From plan</label>
            <select className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" value={fromId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFromId(e.target.value)} data-testid="merge-plans-from">
              <option value="">Select plan</option>
              {plans.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted">To plan</label>
            <select className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" value={toId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setToId(e.target.value)} data-testid="merge-plans-to">
              <option value="">Select plan</option>
              {plans.filter(p => p.id !== fromId).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted">Title (optional)</label>
            <input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" placeholder="Merge title" />
          </div>
          <div>
            <label className="text-xs text-muted">Notes (optional)</label>
            <textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" rows={3} placeholder="Details" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded px-3 py-1 border bg-bg text-fg">Cancel</button>
          <button type="button" disabled={!distinct} onClick={onSave} className="rounded px-3 py-1 bg-brand text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" data-testid="merge-plans-save">Save</button>
        </div>
      </div>
    </div>
  );
}


