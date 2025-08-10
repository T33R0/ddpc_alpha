import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string; planId: string }> }) {
  const { id: vehicleId, planId } = await params;
  const supabase = await getServerSupabase();

  const [{ data: plan }, { data: tasks }] = await Promise.all([
    supabase.from("build_plans").select("id, name, description, status, is_default, updated_at").eq("id", planId).maybeSingle(),
    supabase.from("work_item").select("id, title, status, due, tags").eq("vehicle_id", vehicleId).eq("build_plan_id", planId).order("created_at", { ascending: true }),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            {plan.is_default ? <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">Default</span> : null}
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">{plan.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/vehicles/${vehicleId}/plans`} className="text-sm text-blue-600 hover:underline">Back</Link>
          <form action={mergePlan}>
            <button type="submit" className="text-sm px-3 py-1 rounded border" disabled={plan.status === "merged"}>Merge</button>
          </form>
        </div>
      </div>

      <div className="rounded border p-4 space-y-3">
        <div className="text-sm font-medium">Edit Plan</div>
        <form action={updatePlan} className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col">
            <label htmlFor="plan-name" className="text-xs text-gray-600">Name</label>
            <input id="plan-name" name="name" defaultValue={plan.name} className="border rounded px-2 py-1" />
          </div>
          <div className="flex flex-col md:col-span-2">
            <label htmlFor="plan-description" className="text-xs text-gray-600">Description</label>
            <textarea id="plan-description" name="description" defaultValue={plan.description ?? ""} className="border rounded px-2 py-1 min-h-[72px]"></textarea>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <button type="submit" data-testid="plan-save-btn" className="text-sm px-3 py-1 rounded border">Save</button>
            <form action={setDefault}>
              <button type="submit" data-testid="plan-set-default-btn" className="text-sm px-3 py-1 rounded border" disabled={!!plan.is_default}>Set Default</button>
            </form>
          </div>
        </form>
      </div>

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
