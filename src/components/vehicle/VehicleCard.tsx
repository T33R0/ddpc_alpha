import Link from "next/link";
import Image from "next/image";
import PrivacyBadge from "@/components/PrivacyBadge";
import StatsChip from "@/components/ui/StatsChip";

type Vehicle = { id: string; nickname: string | null; year: number | null; make: string | null; model: string | null; trim: string | null; privacy: string; coverUrl: string | null };
type Metrics = { upcoming: number; lastService: string | null; daysSince: number | null; avgBetween: number | null };

export default function VehicleCard({ v, m, isSignedIn }: { v: Vehicle; m: Metrics; isSignedIn: boolean }) {
  const title = v.nickname ?? `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`;
  const alt = `${title} — cover photo`;
  const prettyDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
  return (
    <div className="border rounded overflow-hidden bg-card" data-testid="vehicle-card">
      {v.coverUrl ? (
        <Image src={v.coverUrl} alt={alt} width={640} height={300} className="w-full h-40 object-cover" data-testid="vehicle-cover" />
      ) : (
        <div className="w-full h-40 bg-bg text-muted flex items-center justify-center" data-testid="vehicle-cover">No photo</div>
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div id={`veh-${v.id}-title`} className="font-medium text-fg">{title}</div>
          <div className="flex items-center gap-3">
            <PrivacyBadge value={v.privacy} />
          </div>
        </div>
        <div className="text-xs text-muted">{[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatsChip label="Upcoming" value={m.upcoming} dataTestId="chip-upcoming" />
          <StatsChip label="Last service" value={prettyDate(m.lastService)} tooltip={m.lastService ? new Date(m.lastService).toLocaleString() : undefined} dataTestId="chip-last-service" />
          <StatsChip label="Days since service" value={m.daysSince ?? '—'} dataTestId="chip-days-since-service" />
          <StatsChip label="Avg days between service" value={m.avgBetween ?? '—'} dataTestId="chip-avg-days-between-service" />
        </div>
        <div className="pt-1">
          <Link href={`/vehicles/${v.id}`} className="inline-flex items-center rounded bg-brand text-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">View</Link>
        </div>
      </div>
    </div>
  );
}


