export default function VehicleCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-[#111318] animate-pulse">
      <div className="w-full h-44 bg-bg/40" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 bg-bg/40 rounded" />
        <div className="h-3 w-1/2 bg-bg/40 rounded" />
        <div className="h-5 w-24 bg-bg/40 rounded" />
      </div>
    </div>
  );
}


