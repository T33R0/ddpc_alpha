import { getServerSupabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import CopyLink from "./CopyLink";
import { sanitizeVehicleForPublic } from "@/lib/public/sanitize";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const supabase = await getServerSupabase();
  const { id } = await params;
  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname, privacy")
    .eq("id", id)
    .maybeSingle();
  const titleName = vehicle?.nickname?.trim()
    ? vehicle.nickname
    : [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
  return {
    title: `${titleName || "Vehicle"} • MyDDPC`,
    openGraph: {
      title: `${titleName || "Vehicle"} • MyDDPC`,
      type: "website",
      images: [{ url: `/v/${id}/opengraph-image` }],
    },
  };
}

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

  // Fetch events
  const { data: events } = await supabase
    .from("event")
    .select("id, notes, created_at, type")
    .eq("vehicle_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const safe = sanitizeVehicleForPublic(vehicle, events ?? []);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{safe.display_name}</h1>
          <span className="text-xs px-2 py-0.5 rounded border bg-green-50 text-green-700">PUBLIC</span>
        </div>
        <div className="flex items-center gap-3">
          <CopyLink />
          <Link className="text-sm text-blue-600 hover:underline" href="/vehicles">Back to vehicles</Link>
        </div>
      </div>
      {safe.photo_url ? (
        <Image src={safe.photo_url} alt="Vehicle photo" width={1280} height={720} className="w-full h-auto max-h-[420px] object-cover rounded" />
      ) : (
        <div className="w-full h-60 bg-gray-100 rounded flex items-center justify-center text-gray-400">No photo</div>
      )}
      <div className="grid sm:grid-cols-2 gap-6">
        <section className="border rounded p-4">
           <h2 className="text-sm font-semibold tracking-wide text-gray-700 mb-3">Overview</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <div><span className="text-gray-500">Year:</span> {safe.year ?? '—'}</div>
            <div><span className="text-gray-500">Make:</span> {safe.make}</div>
            <div><span className="text-gray-500">Model:</span> {safe.model}</div>
            <div><span className="text-gray-500">Trim:</span> {safe.trim ?? '—'}</div>
            <div><span className="text-gray-500">VIN:</span> —</div>
          </div>
        </section>
        <section className="border rounded p-4">
          <h2 className="text-sm font-semibold tracking-wide text-gray-700 mb-3">Recent Events</h2>
          <div className="space-y-2">
            {(safe.events ?? []).length === 0 && (
              <div className="text-sm text-gray-500">No recent public events.</div>
            )}
            {(safe.events ?? []).map((e, idx) => (
              <div key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                <span className="text-xs px-2 py-0.5 rounded border bg-gray-50">{e.type}</span>
                <div className="flex-1">
                  <div>{e.title || "—"}</div>
                  <div className="text-xs text-gray-500">
                    <time dateTime={new Date(e.occurred_at).toISOString()}>{new Date(e.occurred_at).toLocaleString()}</time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
