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
    <div className="border rounded overflow-hidden" data-testid="vehicle-card">
      <Link href={`/vehicles/${v.id}`} className="block focus:outline-none focus:ring-2 focus:ring-blue-500" data-testid="vehicle-card-link">
        {v.coverUrl ? (
          <Image src={v.coverUrl} alt={alt} width={640} height={300} className="w-full h-40 object-cover" data-testid="vehicle-cover" />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400" data-testid="vehicle-cover">No photo</div>
        )}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium hover:underline">{title}</div>
            <div className="flex items-center gap-3">
              <span data-testid="badge-public"><PrivacyBadge value={v.privacy} /></span>
            </div>
          </div>
          <div className="text-xs text-gray-600">{[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatsChip label="Upcoming" value={m.upcoming} dataTestId="chip-upcoming" />
            <StatsChip label="Last service" value={prettyDate(m.lastService)} tooltip={m.lastService ? new Date(m.lastService).toLocaleString() : undefined} dataTestId="chip-last-service" />
            <StatsChip label="Days since service" value={m.daysSince ?? '—'} dataTestId="chip-days-since-service" />
            <StatsChip label="Avg days between service" value={m.avgBetween ?? '—'} dataTestId="chip-avg-days-between-service" />
          </div>
        </div>
      </Link>
      {isSignedIn && (
        <div className="p-3 pt-0 flex items-center gap-3">
          {/* optional per-card actions can live here if needed */}
        </div>
      )}
    </div>
  );
}


