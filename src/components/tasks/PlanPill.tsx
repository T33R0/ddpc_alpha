"use client";
import type { HTMLAttributes } from "react";

export function PlanPill({ name, onClick, className = "", ...props }: { name: string; onClick?: () => void } & HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full bg-card text-muted border px-2 py-0.5 text-xs hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] ${className}`}
      data-testid="task-plan-pill"
      {...props}
    >
      {name}
    </button>
  );
}

export default PlanPill;


