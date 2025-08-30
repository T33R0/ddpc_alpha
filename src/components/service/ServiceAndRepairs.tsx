'use client';
import { useEffect, useState } from 'react';
import type { Inspection, Repair } from '@/types/buyer';

export default function ServiceAndRepairs({ vehicleId }: { vehicleId: string }) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);

  useEffect(() => {
    fetch(`/api/vehicles/${vehicleId}/repairs`).then(r=>r.json()).then(d=>setRepairs(d.items ?? []));
    fetch(`/api/vehicles/${vehicleId}/inspections`).then(r=>r.json()).then(d=>setInspections(d.items ?? []));
  }, [vehicleId]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Section title="Repairs" empty="No repairs logged." items={repairs.map(r => ({
        id: r.id,
        title: r.description,
        sub: `${r.occurred_on}${r.odo ? ` • ${r.odo.toLocaleString()} mi` : ''}`,
        meta: [r.shop, r.cost ? `$${r.cost.toFixed(2)}` : undefined].filter(Boolean).join(' • ')
      }))} />
      <Section title="Inspections" empty="No inspections logged." items={inspections.map(i => ({
        id: i.id,
        title: `${i.kind.toUpperCase()} inspection`,
        sub: `${i.inspected_on}${i.odo ? ` • ${i.odo.toLocaleString()} mi` : ''}`,
        meta: i.result ?? ''
      }))} />
    </div>
  );
}

function Section({ title, empty, items }:{ title:string; empty:string; items:{id:string;title:string;sub?:string;meta?:string}[] }) {
  return (
    <div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      {!items.length ? <div className="opacity-70">{empty}</div> :
        <div className="space-y-3">
          {items.map(it => (
            <div key={it.id} className="rounded-2xl border p-4">
              <div className="text-sm font-medium">{it.title}</div>
              {it.sub && <div className="text-xs opacity-70">{it.sub}</div>}
              {it.meta && <div className="text-xs mt-1">{it.meta}</div>}
            </div>
          ))}
        </div>}
    </div>
  );
}
