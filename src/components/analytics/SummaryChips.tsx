type Props = {
  upcomingCount: number;
  lastServiceDate: string | null;
  events30Count: number;
  size?: "sm" | "md";
};

export default function SummaryChips({ upcomingCount, lastServiceDate, events30Count, size = "sm" }: Props) {
  const base = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";
  const dateLabel = lastServiceDate ? new Date(lastServiceDate).toLocaleDateString() : "—";
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded border bg-white ${base}`}>
        <strong className="font-semibold">{upcomingCount}</strong>
        <span className="text-gray-600">upcoming</span>
      </span>
      <span className={`inline-flex items-center gap-1 rounded border bg-white ${base}`}>
        <span className="text-gray-600">last service</span>
        <strong className="font-semibold">{dateLabel}</strong>
      </span>
      <span className={`inline-flex items-center gap-1 rounded border bg-white ${base}`}>
        <strong className="font-semibold">{events30Count}</strong>
        <span className="text-gray-600">in 30d</span>
      </span>
    </div>
  );
}

export function SummaryChipsSkeleton({ size = "sm" }: { size?: "sm" | "md" }) {
  const base = size === "sm" ? "h-6 w-24" : "h-8 w-28";
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block rounded border bg-gray-100 animate-pulse ${base}`} />
      <span className={`inline-block rounded border bg-gray-100 animate-pulse ${base}`} />
      <span className={`inline-block rounded border bg-gray-100 animate-pulse ${base}`} />
    </div>
  );
}


