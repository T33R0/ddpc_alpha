import { getServerSupabase } from "@/lib/supabase";
import { WorkItem as ClientWorkItem } from "./TasksBoardClient";
import TasksClient from "./TasksClient";

const STATUSES = ["BACKLOG","PLANNED","IN_PROGRESS","DONE"] as const;

type WorkItem = { id: string; title: string; status: typeof STATUSES[number]; tags: string[] | null; due: string | null };

export default async function TasksPage(props: { params: { id: string } }) {
  const vehicleId = props?.params?.id as string;
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
