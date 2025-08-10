import type { HTMLAttributes } from "react";

export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`inline-flex items-center rounded-full bg-card text-muted border px-2 py-0.5 text-xs ${className}`} {...props} />
  );
}

export default Badge;


