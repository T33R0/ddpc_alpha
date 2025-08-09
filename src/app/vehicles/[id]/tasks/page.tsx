import { getServerSupabase } from "@/lib/supabase";
import PrivacyBadge from "@/components/PrivacyBadge";
import { WorkItem as ClientWorkItem } from "./TasksBoardClient";
import TasksClient from "./TasksClient";
import Link from "next/link";

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();
  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname, privacy")
    .eq("id", vehicleId)
    .maybeSingle();
  const { data: items } = await supabase
    .from("work_item")
    .select("id, title, status, tags, due")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: true });

  const initialItems = (items ?? []) as unknown as ClientWorkItem[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{vehicle?.nickname ?? `${vehicle?.year ?? ''} ${vehicle?.make ?? ''} ${vehicle?.model ?? ''}`}</h1>
          <PrivacyBadge value={vehicle?.privacy} />
        </div>
        <div className="flex items-center gap-3">
          {vehicle?.id && <Link href={`/v/${vehicle.id}`} className="text-sm text-blue-600 hover:underline">Public page</Link>}
          <Link href="/vehicles" className="text-sm text-blue-600 hover:underline">Back to vehicles</Link>
        </div>
      </div>

      <TasksClient vehicleId={vehicleId} initialItems={initialItems} />
    </div>
  );
}
