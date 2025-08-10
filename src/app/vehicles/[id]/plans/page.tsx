import Link from "next/link";
import { useState } from "react";
import MergePlansModal from "@/components/plans/MergePlansModal";
import { getServerSupabase } from "@/lib/supabase";
import { createBuildPlan } from "./actions";

export const dynamic = "force-dynamic";

export default async function VehiclePlansPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();

  const { data: plans, error } = await supabase
    .from("build_plans")
    .select("id, name, description, status, is_default, updated_at")
    .eq("vehicle_id", vehicleId)
    .order("updated_at", { ascending: false });

  if (error) {
    return <div className="text-red-600">Failed to load plans: {error.message}</div>;
  }

  // creation handled by server action in ./actions
  async function createPlanAction(formData: FormData) {
    "use server";
    await createBuildPlan(formData);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Build Plans</h1>
        <Link href={`/vehicles/${vehicleId}`} className="text-sm text-blue-600 hover:underline">Back</Link>
      </div>

      <form action={createPlanAction} className="space-y-2">
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <label className="block text-sm" htmlFor="new-plan-name">New plan name</label>
        <input id="new-plan-name" name="name" required className="border rounded px-2 py-1 w-full" />
        <label className="block text-sm" htmlFor="new-plan-desc">Description (optional)</label>
        <textarea id="new-plan-desc" name="description" className="border rounded px-2 py-1 w-full min-h-[72px]"></textarea>
        <button data-testid="new-plan-btn" className="px-3 py-1 rounded bg-black text-white">Create plan</button>
      </form>

      <div data-testid="plans-list" className="divide-y rounded border">
        {(plans ?? []).map(p => (
          <div key={p.id} data-testid={`plan-row-${p.id}`} className="flex items-center justify-between p-3">
            <div className="space-y-1">
              <Link href={`/vehicles/${vehicleId}/plans/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
              {p.description ? <div className="text-xs text-gray-600">{p.description}</div> : null}
            </div>
            <div className="flex items-center gap-2">
              {p.is_default ? <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">Default</span> : null}
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{p.status}</span>
            </div>
          </div>
        ))}
        {(plans ?? []).length === 0 && (
          <div className="p-4 text-gray-600">No plans yet.</div>
        )}
      </div>

      {/* Client entry for merge plans */}
      <MergePlansClient vehicleId={vehicleId} plans={(plans ?? []).map(p => ({ id: p.id, name: p.name }))} />
    </div>
  );
}

// Client wrapper for the merge modal toggle
function MergePlansClient({ vehicleId, plans }: { vehicleId: string; plans: { id: string; name: string }[] }) {
  "use client";
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-end">
      <button type="button" onClick={() => setOpen(true)} className="rounded bg-brand text-white px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" data-testid="merge-plans-open">Merge Plans</button>
      <MergePlansModal open={open} onClose={() => setOpen(false)} vehicleId={vehicleId} plans={plans} />
    </div>
  );
}
