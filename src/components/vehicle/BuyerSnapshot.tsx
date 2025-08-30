'use client';
import { useEffect, useState } from 'react';
import { fetchBuyerSnapshot } from '@/lib/api/snapshot';
import type { BuyerSnapshot } from '@/types/buyer';

export default function BuyerSnapshot({ vehicleId }: { vehicleId: string }) {
  const [snap, setSnap] = useState<BuyerSnapshot | null>(null);

  useEffect(() => { fetchBuyerSnapshot(vehicleId).then(setSnap); }, [vehicleId]);
  if (!snap) return null;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 my-4">
      <Card label="Owners" value={String(snap.owner_count)} />
      <Card label="Title" value={snap.title_status ?? '—'} />
      <Card label="Last Service" value={snap.last_service_on ?? '—'} sub={snap.last_service_odo ? `${snap.last_service_odo.toLocaleString()} mi` : undefined}/>
      <Card label="Last Activity" value={snap.last_activity_on ?? '—'} />
      <Card label="Odometer (last known)" value={snap.last_known_odo ? `${snap.last_known_odo.toLocaleString()} mi` : '—'} />
      <Card label="Notable Mods" value={snap.notable_mods ?? '—'} />
    </div>
  );
}

function Card({ label, value, sub }: { label:string; value:string; sub?:string }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {sub && <div className="text-xs opacity-70">{sub}</div>}
    </div>
  );
}
