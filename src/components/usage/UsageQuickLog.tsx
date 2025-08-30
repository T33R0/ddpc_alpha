'use client';
import { useState } from 'react';

const kinds = ['daily','weekend','show','track_day','road_trip','storage'] as const;

export default function UsageQuickLog({ vehicleId }: { vehicleId: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function log(kind: typeof kinds[number]) {
    setLoading(kind);
    await fetch(`/api/vehicles/${vehicleId}/usage`, {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({ kind, occurred_on: new Date().toISOString().slice(0,10) })
    });
    setLoading(null);
  }

  return (
    <div className="flex flex-wrap gap-2 my-3">
      {kinds.map(k => (
        <button key={k} onClick={() => log(k)}
          className="px-3 py-1 rounded-full border text-sm"
          disabled={loading === k}>
          {loading === k ? '…' : k.replace('_',' ')}
        </button>
      ))}
    </div>
  );
}
