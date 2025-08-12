"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

type Item = { id: string; title: string; due: string | null; vehicle_id: string; status: string };

export default function UpcomingListClient({ items }: { items: Item[] }) {
  const [local, setLocal] = useState<Item[]>(items);
  const grouped = useMemo(() => groupByDate(local), [local]);

  async function snooze(id: string, days: number) {
    const prev = local.slice();
    try {
      const target = local.find((i) => i.id === id);
      if (!target || !target.due) return;
      const next = new Date(target.due);
      next.setDate(next.getDate() + days);
      setLocal((arr) => arr.map((i) => (i.id === id ? { ...i, due: next.toISOString().slice(0, 10) } : i)));
      await fetch(`/api/work-items/${id}/due`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ due: next.toISOString().slice(0, 10) }),
      });
    } catch {
      setLocal(prev);
    }
  }

  async function markDone(id: string) {
    const prev = local.slice();
    try {
      setLocal((arr) => arr.filter((i) => i.id !== id));
      await fetch(`/api/work-items/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
    } catch {
      setLocal(prev);
    }
  }

  if (local.length === 0) return <div className="text-sm text-muted">Nothing due in the next 7 days.</div>;

  return (
    <div className="space-y-3" data-testid="upcoming-list" role="region" aria-label="Upcoming items">
      {Object.entries(grouped).map(([date, list]) => (
        <div key={date} className="space-y-1">
          <div className="text-xs text-muted">{formatDate(date)}</div>
          {list.map((i) => (
            <div key={i.id} className="flex items-center justify-between text-sm border rounded p-2 bg-white" data-testid="upcoming-item">
              <div className="flex items-center gap-2">
                <Link href={`/vehicles/${i.vehicle_id}/tasks`} className="font-medium hover:underline">{i.title}</Link>
                <span className="text-[10px] px-1 py-0.5 rounded border">due</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="text-xs px-2 py-1 rounded border" onClick={() => snooze(i.id, 1)} data-testid="btn-snooze">Snooze 1d</button>
                <button className="text-xs px-2 py-1 rounded border" onClick={() => snooze(i.id, 3)}>3d</button>
                <button className="text-xs px-2 py-1 rounded border" onClick={() => snooze(i.id, 7)}>7d</button>
                <button className="text-xs px-2 py-1 rounded border bg-green-50" onClick={() => markDone(i.id)} data-testid="btn-mark-done">Mark done</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function groupByDate(items: Item[]): Record<string, Item[]> {
  const out: Record<string, Item[]> = {};
  for (const i of items) {
    const key = i.due ? i.due : "No date";
    (out[key] ??= []).push(i);
  }
  return out;
}

function formatDate(dateStr: string): string {
  if (dateStr === "No date") return dateStr;
  try { return new Date(dateStr).toLocaleDateString(); } catch { return dateStr; }
}


