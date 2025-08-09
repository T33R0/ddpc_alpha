import { getServerSupabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import CopyLink from "./CopyLink";

export const dynamic = "force-dynamic";

export default async function PublicVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await getServerSupabase();
  const { id } = await params;

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

  // Recent public-safe events: show titles (notes) and dates only
  const { data: events } = await supabase
    .from("event")
    .select("id, notes, created_at, type")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{vehicle.nickname ?? `${vehicle.year ?? ''} ${vehicle.make} ${vehicle.model}`}</h1>
          <span className="text-xs px-2 py-0.5 rounded border bg-green-50 text-green-700">PUBLIC</span>
        </div>
        <div className="flex items-center gap-3">
          <CopyLink />
          <Link className="text-sm text-blue-600 hover:underline" href="/vehicles">Back to vehicles</Link>
        </div>
      </div>
      {vehicle.photo_url ? (
        <Image src={vehicle.photo_url} alt="Vehicle photo" width={1280} height={720} className="w-full h-auto max-h-[420px] object-cover rounded" />
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
          <div className="font-medium mb-2">Recent Events</div>
          <div className="space-y-2">
            {(events ?? []).length === 0 && (
              <div className="text-sm text-gray-500">No public timeline entries yet.</div>
            )}
            {(events ?? []).map((e) => (
              <div key={e.id} className="text-sm text-gray-800 flex items-start gap-2">
                <span className="text-xs px-2 py-0.5 rounded border bg-gray-50">{e.type}</span>
                <div className="flex-1">
                  <div>{e.notes ?? "—"}</div>
                  <div className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
