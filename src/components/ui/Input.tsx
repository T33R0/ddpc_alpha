import type { InputHTMLAttributes, ForwardedRef } from "react";
import { forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef(function Input(
  { className = "", ...props }: InputProps,
  ref: ForwardedRef<HTMLInputElement>
) {
  return (
    <input
      ref={ref}
      className={`block w-full rounded-md border bg-bg text-fg px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] ${className}`}
      {...props}
    />
  );
});

export default Input;


