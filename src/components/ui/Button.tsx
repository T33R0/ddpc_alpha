"use client";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-white hover:opacity-95",
  secondary: "bg-card text-fg hover:opacity-95 border",
  ghost: "bg-transparent text-fg hover:bg-card",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "primary", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});

export default Button;


