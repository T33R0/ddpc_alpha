"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Toast, { ToastItem, ToastVariant } from "./Toast";

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const idSeq = useRef(0);

  const enqueue = useCallback((message: string, variant: ToastVariant) => {
    const id = `${Date.now()}-${idSeq.current++}`;
    setQueue((q) => [
      ...q,
      {
        id,
        message,
        variant,
        onDone: () => setQueue((curr) => curr.filter((t) => t.id !== id)),
      },
    ]);
  }, []);

  const api = useMemo<ToastApi>(() => ({
    success: (m: string) => enqueue(m, "success"),
    error: (m: string) => enqueue(m, "error"),
    info: (m: string) => enqueue(m, "info"),
  }), [enqueue]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {queue.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}



