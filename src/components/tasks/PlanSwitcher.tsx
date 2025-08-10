"use client";
import { useEffect, useRef } from "react";

export type Plan = { id: string; name: string; is_default: boolean };

export function PlanSwitcher({
  plans,
  currentPlanId,
  onSelect,
  onClose,
}: {
  plans: Plan[];
  currentPlanId: string | null;
  onSelect: (planId: string | null) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute z-50 mt-1 w-48 rounded-md border bg-card shadow">
      <ul role="listbox" aria-label="Select plan" className="max-h-56 overflow-auto py-1">
        <li>
          <button
            role="option"
            aria-selected={currentPlanId == null}
            className={`w-full text-left text-sm px-3 py-1 hover:bg-bg ${currentPlanId == null ? "font-medium" : ""}`}
            onClick={() => onSelect(null)}
          >
            No plan
          </button>
        </li>
        {plans.map(p => (
          <li key={p.id}>
            <button
              role="option"
              aria-selected={currentPlanId === p.id}
              className={`w-full text-left text-sm px-3 py-1 hover:bg-bg ${currentPlanId === p.id ? "font-medium" : ""}`}
              onClick={() => onSelect(p.id)}
            >
              {p.name}{p.is_default ? " (default)" : ""}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlanSwitcher;


