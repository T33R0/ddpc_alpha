"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

type Item = { id: string; notes: string | null; created_at: string; vehicle_id: string; type: string };

const TYPES = ["SERVICE", "INSTALL", "INSPECT", "TUNE", "MOD", "DYNO", "NOTE", "MERGE"] as const;

export default function ActivityFeedClient({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const filtered = useMemo(() => (filter ? items.filter(i => i.type === filter) : items).slice(0, 10), [items, filter]);

  return (
    <div className="space-y-3" data-testid="activity-feed" role="region" aria-label="Recent activity">
      <div className="flex items-center gap-2 flex-wrap">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter(prev => prev === t ? null : t)}
            className={`text-xs px-2 py-1 rounded border ${filter === t ? "bg-bg text-fg border-neutral-700" : "bg-card text-muted hover:text-fg border-neutral-800"}`}
            data-testid="activity-filter-chip"
          >{t}</button>
        ))}
      </div>
      <ul className="space-y-1">
        {filtered.length === 0 ? (
          <li className="text-sm text-muted">No activity.</li>
        ) : (
          filtered.map(i => (
            <li key={i.id} className="flex items-center justify-between text-sm border rounded p-2 bg-card border-neutral-800">
              <Link href={`/vehicles/${i.vehicle_id}/timeline`} className="hover:underline">{i.notes ?? i.type}</Link>
              <span className="text-xs text-muted">{new Date(i.created_at).toLocaleString()}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}


