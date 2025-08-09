"use client";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    firstBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
      if (e.key === "Tab") {
        const focusable = [firstBtnRef.current, lastBtnRef.current].filter(Boolean) as HTMLElement[];
        if (focusable.length === 0) return;
        const current = document.activeElement as HTMLElement;
        if (e.shiftKey) {
          if (current === firstBtnRef.current) {
            e.preventDefault();
            lastBtnRef.current?.focus();
          }
        } else {
          if (current === lastBtnRef.current) {
            e.preventDefault();
            firstBtnRef.current?.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevActive?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;
  const labeledBy = "confirm-dialog-title";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-labelledby={labeledBy}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div ref={dialogRef} className="relative bg-white rounded shadow-lg w-[90%] max-w-sm p-4">
        <h2 id={labeledBy} className="text-sm font-semibold mb-2">{title}</h2>
        {description && <p className="text-sm text-gray-700 mb-3">{description}</p>}
        <div className="flex items-center justify-end gap-2">
          <button ref={firstBtnRef} type="button" className="text-xs px-2 py-1 rounded border" onClick={onCancel}>{cancelLabel}</button>
          <button ref={lastBtnRef} type="button" className="text-xs px-2 py-1 rounded border bg-red-50 text-red-700" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}


