import { getServerSupabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicVehiclePage({ params }: { params: { id: string } }) {
  const supabase = await getServerSupabase();
  const id = params.id;

  const { data: vehicle, error } = await supabase
    .from("vehicle")
    .select("id, vin, year, make, model, trim, nickname, privacy, photo_url, garage_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return <div className="space-y-4"><h1 className="text-2xl font-semibold">Vehicle</h1><p className="text-red-600">{error.message}</p></div>;
  }
  if (!vehicle) {
    return <div className="space-y-4"><h1 className="text-2xl font-semibold">Vehicle</h1><p className="text-gray-600">Not found.</p></div>;
  }
  if (vehicle.privacy !== "PUBLIC") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{vehicle.nickname ?? `${vehicle.year ?? ''} ${vehicle.make} ${vehicle.model}`}</h1>
        <p className="text-gray-600">This vehicle is private.</p>
        <Link className="text-blue-600 hover:underline" href="/">Go home</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{vehicle.nickname ?? `${vehicle.year ?? ''} ${vehicle.make} ${vehicle.model}`}</h1>
        <Link className="text-sm text-blue-600 hover:underline" href="/vehicles">Back to vehicles</Link>
      </div>
      {vehicle.photo_url ? (
        <img src={vehicle.photo_url} alt="Vehicle photo" className="w-full max-h-[420px] object-cover rounded" />
      ) : (
        <div className="w-full h-60 bg-gray-100 rounded flex items-center justify-center text-gray-400">No photo</div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <div className="font-medium mb-2">Specs</div>
          <div className="text-sm text-gray-700 space-y-1">
            <div><span className="text-gray-500">Year:</span> {vehicle.year ?? '—'}</div>
            <div><span className="text-gray-500">Make:</span> {vehicle.make}</div>
            <div><span className="text-gray-500">Model:</span> {vehicle.model}</div>
            <div><span className="text-gray-500">Trim:</span> {vehicle.trim ?? '—'}</div>
            <div><span className="text-gray-500">VIN:</span> {vehicle.vin ?? '—'}</div>
          </div>
        </div>
        <div className="border rounded p-4">
          <div className="font-medium mb-2">About</div>
          <div className="text-sm text-gray-700">Public profile preview. Timeline, parts, and tasks will appear here in the next iteration.</div>
        </div>
      </div>
    </div>
  );
}
