"use client";

import { useEffect, useMemo, useState } from "react";

type WishlistItem = {
  id: string;
  title: string;
  vendor?: string | null;
  estPrice?: number | null;
  priority?: number | null; // 1..5
  status?: "PENDING" | "APPROVED" | "PURCHASED";
  url?: string | null;
};

export default function VehicleWishlistBody({ vehicleId }: { vehicleId: string }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [boardMode, setBoardMode] = useState(false);
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const totals = useMemo(() => {
    const byCol: Record<string, number> = { PENDING: 0, APPROVED: 0, PURCHASED: 0 };
    for (const it of items) {
      const key = it.status || "PENDING";
      byCol[key] += Number(it.estPrice || 0);
    }
    return byCol;
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/wishlist?vehicleId=${encodeURIComponent(vehicleId)}`, { cache: "no-store" });
        const data = (await res.json()) as { ok?: boolean; items?: Array<{ id: string; url: string | null; status: string | null; priority: number | null; est_unit_price: number | null; notes: string | null }>; message?: string };
        if (cancelled) return;
        if (!res.ok || data.ok === false) {
          // Graceful fallback: keep empty list
          setItems([]);
          return;
        }
        const toTitle = (url: string | null, notes: string | null): string => {
          if (notes && notes.trim()) return notes.trim();
          if (url) try { return new URL(url).hostname; } catch { return url; }
          return "Wishlist item";
        };
        const mapped: WishlistItem[] = (data.items || []).map((w) => ({
          id: w.id,
          title: toTitle(w.url ?? null, w.notes ?? null),
          vendor: w.url ? (() => { try { return new URL(w.url!).hostname; } catch { return null; } })() : null,
          estPrice: w.est_unit_price ?? null,
          priority: (typeof w.priority === 'number' ? w.priority : null),
          status: (w.status as WishlistItem["status"]) || "PENDING",
          url: w.url ?? null,
        }));
        setItems(mapped);
      } catch {
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [vehicleId]);

  async function addFromUrl() {
    const url = prompt("Paste product URL");
    if (!url) return;
    try {
      setLoading(true);
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vehicleId, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      const created: WishlistItem = {
        id: (data?.item?.id as string) || crypto.randomUUID(),
        title: url,
        vendor: new URL(url).hostname,
        estPrice: null,
        priority: 3,
        status: "PENDING",
        url,
      };
      setItems((prev) => [created, ...prev]);
      if (data.budgetId && !budgetId) setBudgetId(data.budgetId);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function statusPill(s?: WishlistItem["status"]) {
    const map: Record<string, string> = {
      PENDING: "bg-amber-500/15 text-amber-500",
      APPROVED: "bg-blue-500/15 text-blue-400",
      PURCHASED: "bg-emerald-500/15 text-emerald-400",
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${map[s || "PENDING"]}`}>{s || "PENDING"}</span>;
  }

  function Stars({ n = 0 }: { n?: number | null }) {
    const count = Math.max(0, Math.min(5, Number(n || 0)));
    return (
      <span aria-label={`Priority ${count} of 5`} className="text-yellow-400">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>{i < count ? "★" : "☆"}</span>
        ))}
      </span>
    );
  }

  async function markOrdered(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "PURCHASED" } : it)));
  }

  function openVendor(url?: string | null) {
    if (!url) return;
    window.open(url, "_blank");
  }

  function addResource(id: string) {
    alert(`Add resource for item ${id} (stub)`);
  }

  function addToBudget(id: string) {
    alert(`Open Create Budget Line for ${id} (stub)`);
  }

  async function toggleShareBoard(on: boolean) {
    if (!budgetId) {
      alert("No budget yet. Create one by adding to budget first.");
      return;
    }
    setSharing(true);
    try {
      const res = await fetch(`/api/budgets/${budgetId}/share`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Share failed");
      const token: string | undefined = data.token;
      await navigator.clipboard.writeText(token || "");
      alert("Share link copied to clipboard");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Wishlist</h1>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={boardMode} onChange={(e) => setBoardMode(e.target.checked)} />
            Budget Board
          </label>
          <button
            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm shadow hover:opacity-90 disabled:opacity-50"
            onClick={addFromUrl}
            disabled={loading}
          >
            + Add from URL
          </button>
        </div>
      </div>

      {!boardMode && (
        <>
          {items.length === 0 ? (
            <div className="text-muted">No wishlist items yet. Use “Add from URL”.</div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
              {items.map((it) => (
                <div key={it.id} className="mb-4 break-inside-avoid rounded border bg-card text-card-foreground p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{it.title}</div>
                      {it.vendor && (
                        <div className="mt-1 text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">
                          {it.vendor}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {statusPill(it.status)}
                      <Stars n={it.priority} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="text-muted">
                      {it.estPrice != null ? `$${Number(it.estPrice).toLocaleString()}` : "—" }
                    </div>
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:underline" onClick={() => addToBudget(it.id)}>Add to Budget</button>
                      <button className="text-emerald-500 hover:underline" onClick={() => markOrdered(it.id)}>Mark Ordered</button>
                      <button className="text-indigo-500 hover:underline" onClick={() => openVendor(it.url)}>Open Vendor</button>
                      <button className="text-purple-500 hover:underline" onClick={() => addResource(it.id)}>Add Resource</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {boardMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">
              Totals — Pending ${totals.PENDING.toLocaleString()} · Approved ${totals.APPROVED.toLocaleString()} · Purchased ${totals.PURCHASED.toLocaleString()}
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" onChange={(e) => e.target.checked && toggleShareBoard(true)} disabled={!budgetId || sharing} />
              Share
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["PENDING", "APPROVED", "PURCHASED"].map((col) => (
              <div key={col} className="rounded border bg-card text-card-foreground p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{col}</div>
                  <div className="text-xs text-muted">${totals[col as keyof typeof totals].toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  {items.filter((it) => (it.status || "PENDING") === col).map((it) => (
                    <div key={it.id} className="rounded border bg-background p-2">
                      <div className="flex items-center justify-between">
                        <div className="truncate pr-2">{it.title}</div>
                        <div className="text-xs text-muted">{it.estPrice != null ? `$${it.estPrice}` : "—"}</div>
                      </div>
                    </div>
                  ))}
                  {items.filter((it) => (it.status || "PENDING") === col).length === 0 && (
                    <div className="text-xs text-muted">No items</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

