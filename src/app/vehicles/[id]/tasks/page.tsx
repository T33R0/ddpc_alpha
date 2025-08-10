import { getServerSupabase } from "@/lib/supabase";
import PrivacyBadge from "@/components/PrivacyBadge";
import { WorkItem as ClientWorkItem } from "./TasksBoardClient";
import TasksClient from "./TasksClient";
import Link from "next/link";
import ErrorBoundary from "@/components/ErrorBoundary";

type Role = "OWNER" | "MANAGER" | "CONTRIBUTOR" | "VIEWER";

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const reqId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`;
  if (process.env.NODE_ENV !== 'production') {
    console.log(JSON.stringify({ level: 'info', q: 'tasks_page_load', reqId, actor: user?.id ?? null, vehicleId }));
  }
  const { data: vehicle } = await supabase
    .from("vehicle")
    .select("id, year, make, model, nickname, privacy, garage_id")
    .eq("id", vehicleId)
    .maybeSingle();
  const { data: items } = await supabase
    .from("work_item")
    .select("id, title, status, tags, due")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: true });

  const initialItems = (items ?? []) as unknown as ClientWorkItem[];

  // Determine permissions: VIEWER has read-only; CONTRIBUTOR+ can write
  async function getRole(garageId: string | null | undefined): Promise<Role|null> {
    if (!garageId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: m } = await supabase
      .from("garage_member")
      .select("role")
      .eq("garage_id", garageId)
      .eq("user_id", user.id)
      .maybeSingle();
    return (m?.role as Role) ?? null;
  }
  const role = await getRole((vehicle as { garage_id?: string } | null)?.garage_id ?? null);
  const canWrite = role === "OWNER" || role === "MANAGER" || role === "CONTRIBUTOR";

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

      <p className="text-sm text-gray-700 border rounded p-3 bg-white" data-test="tasks-helper-copy">
        <strong>Tasks</strong> = planned work. <strong>Timeline</strong> = what actually happened. When you complete a task, you can also log a Timeline event.
      </p>

      <ErrorBoundary message="Failed to load tasks.">
        <TasksClient vehicleId={vehicleId} initialItems={initialItems} canWrite={canWrite} />
      </ErrorBoundary>
    </div>
  );
}
