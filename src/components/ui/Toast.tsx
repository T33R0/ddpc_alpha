"use client";
import { useEffect } from "react";

export type ToastVariant = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  onDone: () => void;
};

export default function Toast({ id, message, variant, onDone }: ToastItem) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const base =
    "flex items-start gap-2 w-80 max-w-[90vw] rounded-md shadow-md border px-3 py-2 text-sm animate-in fade-in slide-in-from-top-2";
  const byVariant: Record<ToastVariant, string> = {
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
  };

  return (
    <div
      key={id}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`${base} ${byVariant[variant]}`}
    >
      <div className="pt-0.5">
        {variant === "success" && <span aria-hidden>✓</span>}
        {variant === "error" && <span aria-hidden>⚠️</span>}
        {variant === "info" && <span aria-hidden>ℹ️</span>}
      </div>
      <div className="flex-1">{message}</div>
      <button
        onClick={onDone}
        className="ml-2 text-xs text-gray-600 hover:text-gray-900"
        aria-label="Dismiss"
      >
        Close
      </button>
    </div>
  );
}



