export default function VehicleCardSkeleton() {
  return (
    <div className="border rounded overflow-hidden bg-card animate-pulse">
      <div className="w-full h-40 bg-bg" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-2/3 bg-bg rounded" />
        <div className="h-3 w-1/2 bg-bg rounded" />
        <div className="h-5 w-24 bg-bg rounded" />
      </div>
    </div>
  );
}


