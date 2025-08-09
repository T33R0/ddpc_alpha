import { getServerSupabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

function maskUserId(uid: string | null): string {
  if (!uid) return "anon";
  return uid.slice(0, 8) + "…";
}

type ActivityRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  diff: unknown;
  created_at: string;
};

export default async function VehicleActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();

  // Fetch related entity ids (events, work_items) to aggregate activity
  const [eventsRes, workRes] = await Promise.all([
    supabase.from("event").select("id").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }).limit(200),
    supabase.from("work_item").select("id").eq("vehicle_id", vehicleId).order("created_at", { ascending: false }).limit(200),
  ]);
  const relatedIds = [vehicleId]
    .concat((eventsRes.data ?? []).map((r: { id: string }) => r.id))
    .concat((workRes.data ?? []).map((r: { id: string }) => r.id));

  // If too many, slice to avoid overly large IN
  const idsForQuery = relatedIds.slice(0, 200);

  let activity: ActivityRow[] = [];
  if (idsForQuery.length > 0) {
    const { data } = await supabase
      .from("activity_log")
      .select("id, entity_type, entity_id, user_id, diff, created_at")
      .in("entity_id", idsForQuery)
      .order("created_at", { ascending: false })
      .limit(50);
    activity = (data as ActivityRow[] | null) ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Activity</h1>
        <Link href={`/vehicles/${vehicleId}`} className="text-blue-600 text-sm hover:underline">Back to vehicle</Link>
      </div>
      {activity.length === 0 ? (
        <div className="text-sm text-gray-600 border rounded p-6">No recent activity.</div>
      ) : (
        <ul className="space-y-3">
          {activity.map((row) => (
            <li key={row.id} className="border rounded p-3 bg-white">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{row.entity_type}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{new Date(row.created_at).toLocaleString()}</span>
                </div>
                <div className="text-gray-500">{maskUserId(row.user_id)}</div>
              </div>
              <div className="mt-2">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words max-h-40 overflow-auto">{JSON.stringify(row.diff, null, 2)}</pre>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
