import { getServerSupabase } from "@/lib/supabase";
import { WorkItem as ClientWorkItem } from "./TasksBoardClient";
import TasksClient from "./TasksClient";

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();
  const { data: items } = await supabase
    .from("work_item")
    .select("id, title, status, tags, due")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: true });

  const initialItems = (items ?? []) as unknown as ClientWorkItem[];

  return (
    <TasksClient vehicleId={vehicleId} initialItems={initialItems} />
  );
}
