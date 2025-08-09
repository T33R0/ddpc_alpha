"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  defaultTitle: string;
  onCancel: () => void;
  onSubmit: (opts: { logEvent: boolean; title: string; notes?: string; dateISO?: string }) => Promise<void> | void;
};

export default function CompleteModal({ open, defaultTitle, onCancel, onSubmit }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const firstRef = useRef<HTMLButtonElement | null>(null);
  const [logEvent, setLogEvent] = useState(true);
  const [title, setTitle] = useState(defaultTitle);
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setNotes("");
      setWhen(new Date().toISOString().slice(0, 16));
    }
  }, [open, defaultTitle]);

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement as HTMLElement | null;
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); active?.focus?.(); };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="task-complete-title" data-test="task-complete-modal">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div ref={rootRef} className="relative bg-white rounded shadow-lg w-[92%] max-w-md p-4">
        <h2 id="task-complete-title" className="text-sm font-semibold mb-2">Complete task</h2>
        <label className="inline-flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" checked={logEvent} onChange={(e) => setLogEvent(e.target.checked)} data-test="task-complete-log-checkbox" />
          <span>Also log this to Timeline</span>
        </label>
        {logEvent && (
          <div className="space-y-2 mb-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-600">Title</label>
              <input className="border rounded px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} data-test="task-complete-title" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-600">Notes</label>
              <textarea className="border rounded px-2 py-1" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} data-test="task-complete-notes" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-600">Date</label>
              <input type="datetime-local" className="border rounded px-2 py-1" value={when} onChange={(e) => setWhen(e.target.value)} data-test="task-complete-date" />
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button ref={firstRef} className="text-xs px-2 py-1 rounded border" onClick={onCancel}>Cancel</button>
          <button className="text-xs px-2 py-1 rounded border bg-black text-white" onClick={async () => {
            const dateISO = logEvent && when ? new Date(when).toISOString() : undefined;
            await onSubmit({ logEvent, title, notes: notes || undefined, dateISO });
          }}>Complete</button>
        </div>
      </div>
    </div>
  );
}


