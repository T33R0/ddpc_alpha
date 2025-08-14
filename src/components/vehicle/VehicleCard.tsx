import Link from "next/link";
import Image from "next/image";
import PrivacyBadge from "@/components/PrivacyBadge";

type Vehicle = { id: string; nickname: string | null; year: number | null; make: string | null; model: string | null; trim: string | null; privacy: string; coverUrl: string | null };
type Metrics = { upcoming: number; lastService: string | null; daysSince: number | null; avgBetween: number | null };

export default function VehicleCard({ v, m }: { v: Vehicle; m: Metrics }) {
  const title = v.nickname && v.nickname.trim().length > 0 ? v.nickname : `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`;
  const alt = `${title} — cover photo`;
  const sinceStr = typeof m.daysSince === "number" ? `${m.daysSince} days ago` : "—";
  const due = (m.upcoming ?? 0) > 0;
  const meta = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="block rounded-2xl overflow-hidden border border-neutral-800 bg-[#111318] hover:-translate-y-0.5 hover:shadow-lg transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
      data-testid="vehicle-card"
      aria-labelledby={`veh-${v.id}-title`}
    >
      <div className="relative">
        {v.coverUrl ? (
          <Image src={v.coverUrl} alt={alt} width={640} height={300} className="w-full h-44 object-cover" data-testid="vehicle-cover" />
        ) : (
          <div className="w-full h-44 bg-bg text-muted flex items-center justify-center" data-testid="vehicle-cover">No photo</div>
        )}
        {due && (
          <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-yellow-400/10 text-yellow-300 border border-yellow-500/30" title="Maintenance due">△</div>
        )}
      </div>
      <div className="p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <div id={`veh-${v.id}-title`} className="text-base font-semibold text-fg">{title}</div>
          <PrivacyBadge value={v.privacy} />
        </div>
        <div className="text-xs text-muted">{meta}</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-muted">Status</div>
            <div className={due ? "text-yellow-300" : "text-gray-300"}>{due ? "Maintenance Due" : "OK"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">Last Update</div>
            <div className="text-gray-300">{sinceStr}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}


