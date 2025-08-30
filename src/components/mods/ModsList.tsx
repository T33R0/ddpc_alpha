'use client';
import { useEffect, useState } from 'react';
import type { ModEntry } from '@/types/buyer';

export default function ModsList({ vehicleId }: { vehicleId: string }) {
  const [items, setItems] = useState<ModEntry[]>([]);
  useEffect(() => { fetch(`/api/vehicles/${vehicleId}/mods`).then(r=>r.json()).then(d=>setItems(d.items ?? [])); }, [vehicleId]);

  if (!items.length) return <div className="opacity-70">No modifications recorded yet.</div>;

  return (
    <div className="space-y-3">
      {items.map(m => (
        <div key={m.part_state_id} className="rounded-2xl border p-4">
          <div className="text-sm font-medium">{m.brand ?? ''} {m.part_name ?? ''}</div>
          <div className="text-xs opacity-70">{m.part_number ?? ''}</div>
          <div className="text-xs mt-1">
            {m.slot_label ?? m.slot_code ?? '—'} • Installed {m.installed_on ?? 'unknown'}
            {m.removed_on ? ` • Removed ${m.removed_on}` : ''}
          </div>
          {m.notes && <div className="text-sm mt-2">{m.notes}</div>}
        </div>
      ))}
    </div>
  );
}
