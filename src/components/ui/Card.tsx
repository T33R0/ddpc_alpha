import type { PropsWithChildren, HTMLAttributes } from "react";

export function Card({ className = "", ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`rounded-xl border bg-card text-fg shadow-sm ${className}`}
      {...props}
    />
  );
}

export default Card;


