// src/components/timeline/EventTypeIcon.tsx
"use client";
import * as React from "react";
import * as Icons from "lucide-react";
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function EventTypeIcon({ iconName, color, label, size = 20 }: { iconName?: string | null; color?: string | null; label?: string | null; size?: number }) {
  const Icon = (iconName && (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[iconName]) || Icons.FileText;
  const bgClass: Record<string, string> = {
    emerald: "bg-emerald-500/15",
    rose: "bg-rose-500/15",
    amber: "bg-amber-500/15",
    sky: "bg-sky-500/15",
    cyan: "bg-cyan-500/15",
    violet: "bg-violet-500/15",
    slate: "bg-slate-500/15",
  };
  const textClass: Record<string, string> = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
    sky: "text-sky-400",
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    slate: "text-slate-400",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl",
        bgClass[(color || "slate")] || bgClass.slate,
        textClass[(color || "slate")] || textClass.slate,
        "h-9 w-9"
      )}
      aria-label={label || undefined}
      title={label || undefined}
    >
      <Icon size={size} className="shrink-0" />
    </div>
  );
}


