import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";
import { createVehicle } from "./actions";
import UploadPhoto from "@/components/UploadPhoto";
import VehicleActions from "@/components/VehicleActions";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: vehicles, error } = await supabase
    .from("vehicle")
    .select("id, vin, year, make, model, trim, nickname, privacy, photo_url")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Vehicles</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">Home</Link>
      </div>

      {user ? (
        <form action={createVehicle} className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded p-4">
          <input name="vin" placeholder="VIN" className="border rounded px-2 py-1 md:col-span-2" />
          <input name="year" placeholder="Year" type="number" className="border rounded px-2 py-1" />
          <input name="make" placeholder="Make" className="border rounded px-2 py-1" required />
          <input name="model" placeholder="Model" className="border rounded px-2 py-1" required />
          <input name="trim" placeholder="Trim" className="border rounded px-2 py-1" />
          <input name="nickname" placeholder="Nickname" className="border rounded px-2 py-1 md:col-span-2" />
          <select name="privacy" className="border rounded px-2 py-1">
            <option value="PRIVATE">Private</option>
            <option value="PUBLIC">Public</option>
          </select>
          <button type="submit" className="bg-black text-white rounded px-3 py-1 md:col-span-2">Add Vehicle</button>
        </form>
      ) : (
        <p className="text-sm text-gray-600">Sign in to add and manage vehicles.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(vehicles ?? []).map((v) => (
          <div key={v.id} className="border rounded overflow-hidden">
            {v.photo_url ? (
              <img src={v.photo_url} alt={v.nickname ?? `${v.year ?? ''} ${v.make} ${v.model}`} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">No photo</div>
            )}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{v.nickname ?? `${v.year ?? ''} ${v.make} ${v.model}`}</div>
                <span className="text-xs px-2 py-0.5 rounded border">{v.privacy}</span>
              </div>
              <div className="text-xs text-gray-600">{[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}</div>
              <div className="flex items-center gap-3">
                <Link href={`/v/${v.id}`} className="text-blue-600 text-sm hover:underline">Public page</Link>
                <Link href={`/vehicles/${v.id}/tasks`} className="text-blue-600 text-sm hover:underline">Tasks</Link>
                <Link href={`/vehicles/${v.id}/timeline`} className="text-blue-600 text-sm hover:underline">Timeline</Link>
                {user && <UploadPhoto vehicleId={v.id} />}
              </div>
              {user && (
                <div className="pt-2 border-t">
                  <VehicleActions id={v.id} initialNickname={v.nickname} initialPrivacy={v.privacy} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
