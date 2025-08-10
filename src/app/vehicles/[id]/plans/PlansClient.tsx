"use client";
import { useState } from "react";
import MergePlansModal from "@/components/plans/MergePlansModal";

type Plan = { id: string; name: string; is_default?: boolean | null };

export default function PlansClient({ vehicleId, plans }: { vehicleId: string; plans: Plan[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-end">
        <button
          type="button"
          data-testid="merge-plans-open"
          className="rounded bg-brand text-white px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          onClick={() => setOpen(true)}
        >
          Merge Plans
        </button>
      </div>
      <MergePlansModal open={open} onClose={() => setOpen(false)} vehicleId={vehicleId} plans={plans} />
    </>
  );
}


