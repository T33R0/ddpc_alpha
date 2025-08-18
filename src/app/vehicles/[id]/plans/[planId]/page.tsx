import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";
import PlanDetail from "@/components/build/PlanDetail";

type JobRow = { id: string; title: string; description: string | null; status: string };
type GroupKey = "planning" | "purchased" | "active" | "complete" | "canceled";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string; planId: string }> }) {
  const { id: vehicleId, planId } = await params;
  const supabase = await getServerSupabase();

  const [
    { data: plan },
    { data: tasks },
    { data: jobs },
    { data: planTotal }
  ] = await Promise.all([
    supabase.from("build_plans").select("id, name, description, status, is_default, updated_at").eq("id", planId).maybeSingle(),
    supabase.from("work_item").select("id, title, status, due, tags").eq("vehicle_id", vehicleId).eq("build_plan_id", planId).order("created_at", { ascending: true }),
    supabase.from("job").select("id, title, description, status, created_at, updated_at").eq("build_plan_id", planId).order("created_at", { ascending: true }),
    supabase.from("v_build_plan_costs").select("cost_total").eq("build_plan_id", planId).single(),
  ]);

  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Plan</h1>
          <Link href={`/vehicles/${vehicleId}/plans`} className="text-sm text-blue-600 hover:underline">Back</Link>
        </div>
        <div className="text-gray-600">Not found.</div>
      </div>
    );
  }

  async function mergePlan() {
    "use server";
    await fetch(`${process.env.BASE_URL ?? ""}/api/build-plans/${planId}/merge`, { method: "POST" });
  }

  async function updatePlan(formData: FormData) {
    "use server";
    const name = (formData.get("name") || "").toString().trim();
    const description = (formData.get("description") || "").toString();
    await fetch(`${process.env.BASE_URL ?? ""}/api/build-plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
  }

  async function setDefault() {
    "use server";
    await fetch(`${process.env.BASE_URL ?? ""}/api/build-plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    });
  }

  const isOpen = plan.status === "open";

  const groups: Record<GroupKey, JobRow[]> = {
    planning: [],
    purchased: [],
    active: [],
    complete: [],
    canceled: [],
  };
  const toGroup = (s?: string): GroupKey => {
    const k = (s ?? "planning").toLowerCase();
    switch (k) {
      case "planning":
      case "purchased":
      case "active":
      case "complete":
      case "canceled":
        return k;
      default:
        return "planning";
    }
  };
  for (const j of (jobs ?? [])) {
    const row: JobRow = {
      id: j.id as string,
      title: j.title as string,
      description: (j as { description?: string | null })?.description ?? null,
      status: (j.status as string) ?? "planning",
    };
    groups[toGroup(j.status as string)].push(row);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            {plan.is_default ? <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">Default</span> : null}
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">{plan.status}</span>
            <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">Total: ${(planTotal?.cost_total ?? 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/vehicles/${vehicleId}/plans`} className="text-sm text-blue-600 hover:underline">Back</Link>
          <Link href={`/vehicles/${vehicleId}/plans/${planId}/budget`} className="text-sm px-3 py-1 rounded border" prefetch>
            Export Budget
          </Link>
          <form action={mergePlan}>
            <button type="submit" className="text-sm px-3 py-1 rounded border" disabled={plan.status === "merged"}>Merge</button>
          </form>
        </div>
      </div>

      {/* Client plan interactivity */}
      <PlanDetail planId={planId} />

      <div className="rounded border divide-y">
        <div className="p-3 text-sm font-medium bg-gray-50">Tasks in this plan</div>
        {(tasks ?? []).map(t => (
          <div key={t.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-gray-600">{t.status}{t.due ? ` • due ${new Date(t.due).toLocaleDateString()}` : ""}</div>
            </div>
          </div>
        ))}
        {(tasks ?? []).length === 0 && (
          <div className="p-4 text-gray-600">No tasks assigned to this plan.</div>
        )}
      </div>
    </div>
  );
}
