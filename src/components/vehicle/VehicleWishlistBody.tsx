"use client";

import { useEffect, useMemo, useState } from "react";

type WishlistItem = {
\tid: string;
\ttitle: string;
\tvendor?: string | null;
\testPrice?: number | null;
\tpriority?: number | null; // 1..5
\tstatus?: "PENDING" | "APPROVED" | "PURCHASED";
\turl?: string | null;
};

export default function VehicleWishlistBody({ vehicleId }: { vehicleId: string }) {
\tconst [items, setItems] = useState<WishlistItem[]>([]);
\tconst [loading, setLoading] = useState(false);
\tconst [boardMode, setBoardMode] = useState(false);
\tconst [budgetId, setBudgetId] = useState<string | null>(null);
\tconst [sharing, setSharing] = useState(false);

\tconst totals = useMemo(() => {
\t\tconst byCol: Record<string, number> = { PENDING: 0, APPROVED: 0, PURCHASED: 0 };
\t\tfor (const it of items) {
\t\t\tconst key = it.status || "PENDING";
\t\t\tbyCol[key] += Number(it.estPrice || 0);
\t\t}
\t\treturn byCol;
\t}, [items]);

\tuseEffect(() => {
\t\tsetItems([]);
\t}, [vehicleId]);

\tasync function addFromUrl() {
\t\tconst url = prompt("Paste product URL");
\t\tif (!url) return;
\t\ttry {
\t\t\tsetLoading(true);
\t\t\tconst res = await fetch("/api/wishlist", {
\t\t\t\tmethod: "POST",
\t\t\t\theaders: { "content-type": "application/json" },
\t\t\t\tbody: JSON.stringify({ vehicleId, url }),
\t\t\t});
\t\t\tconst data = await res.json();
\t\t\tif (!res.ok) throw new Error(data?.error || "Failed");
\t\t\tconst created: WishlistItem = {
\t\t\t\tid: (data?.item?.id as string) || crypto.randomUUID(),
\t\t\t\ttitle: url,
\t\t\t\tvendor: new URL(url).hostname,
\t\t\t\testPrice: null,
\t\t\t\tpriority: 3,
\t\t\t\tstatus: "PENDING",
\t\t\t\turl,
\t\t\t};
\t\t\tsetItems((prev) => [created, ...prev]);
\t\t\tif (data.budgetId && !budgetId) setBudgetId(data.budgetId);
\t\t} catch (e) {
\t\t\talert((e as Error).message);
\t\t} finally {
\t\t\tsetLoading(false);
\t\t}
\t}

\tfunction statusPill(s?: WishlistItem["status"]) {
\t\tconst map: Record<string, string> = {
\t\t\tPENDING: "bg-amber-500/15 text-amber-500",
\t\t\tAPPROVED: "bg-blue-500/15 text-blue-400",
\t\t\tPURCHASED: "bg-emerald-500/15 text-emerald-400",
\t\t};
\t\treturn <span className={`px-2 py-0.5 rounded text-xs ${map[s || "PENDING"]}`}>{s || "PENDING"}</span>;
\t}

\tfunction Stars({ n = 0 }: { n?: number | null }) {
\t\tconst count = Math.max(0, Math.min(5, Number(n || 0)));
\t\treturn (
\t\t\t<span aria-label={`Priority ${count} of 5`} className="text-yellow-400">
\t\t\t\t{Array.from({ length: 5 }, (_, i) => (
\t\t\t\t\t<span key={i}>{i < count ? "★" : "☆"}</span>
\t\t\t\t))}
\t\t\t</span>
\t\t);
\t}

\tasync function markOrdered(id: string) {
\t\tsetItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "PURCHASED" } : it)));
\t}

\tfunction openVendor(url?: string | null) {
\t\tif (!url) return;
\t\twindow.open(url, "_blank");
\t}

\tfunction addResource(id: string) {
\t\talert(`Add resource for item ${id} (stub)`);
\t}

\tfunction addToBudget(id: string) {
\t\talert(`Open Create Budget Line for ${id} (stub)`);
\t}

\tasync function toggleShareBoard(on: boolean) {
\t\tif (!budgetId) {
\t\t\talert("No budget yet. Create one by adding to budget first.");
\t\t\treturn;
\t\t}
\t\tsetSharing(true);
\t\ttry {
\t\t\tconst res = await fetch(`/api/budgets/${budgetId}/share`, { method: "POST" });
\t\t\tconst data = await res.json();
\t\t\tif (!res.ok) throw new Error(data?.message || "Share failed");
\t\t\tconst token: string | undefined = data.token;
\t\t\tawait navigator.clipboard.writeText(token || "");
\t\t\talert("Share link copied to clipboard");
\t\t} catch (e) {
\t\t\talert((e as Error).message);
\t\t} finally {
\t\t\tsetSharing(false);
\t\t}
\t}

\treturn (
\t\t<div className="space-y-6">
\t\t\t<div className="flex items-center justify-between">
\t\t\t\t<h1 className="text-2xl font-semibold">Wishlist</h1>
\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t<label className="inline-flex items-center gap-2 text-sm text-muted">
\t\t\t\t\t\t<input type="checkbox" checked={boardMode} onChange={(e) => setBoardMode(e.target.checked)} />
\t\t\t\t\t\tBudget Board
\t\t\t\t\t</label>
\t\t\t\t\t<button
\t\t\t\t\t\tclassName="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm shadow hover:opacity-90 disabled:opacity-50"
\t\t\t\t\t\tonClick={addFromUrl}
\t\t\t\t\t\tdisabled={loading}
\t\t\t\t\t>
\t\t\t\t\t\t+ Add from URL
\t\t\t\t\t</button>
\t\t\t\t</div>
\t\t\t</div>

\t\t\t{!boardMode && (
\t\t\t\t<>
\t\t\t\t\t{items.length === 0 ? (
\t\t\t\t\t\t<div className="text-muted">No wishlist items yet. Use “Add from URL”.</div>
\t\t\t\t\t) : (
\t\t\t\t\t\t<div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
\t\t\t\t\t\t\t{items.map((it) => (
\t\t\t\t\t\t\t\t<div key={it.id} className="mb-4 break-inside-avoid rounded border bg-card text-card-foreground p-4 shadow-sm">
\t\t\t\t\t\t\t\t\t<div className="flex items-start justify-between gap-3">
\t\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t\t<div className="font-medium">{it.title}</div>
\t\t\t\t\t\t\t\t\t\t\t{it.vendor && (
\t\t\t\t\t\t\t\t\t\t\t\t<div className="mt-1 text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">
\t\t\t\t\t\t\t\t\t\t\t\t\t{it.vendor}
\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t<div className="flex flex-col items-end gap-1">
\t\t\t\t\t\t\t\t\t\t\t{statusPill(it.status)}
\t\t\t\t\t\t\t\t\t\t\t<Stars n={it.priority} />
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<div className="mt-3 flex items-center justify-between text-sm">
\t\t\t\t\t\t\t\t\t\t<div className="text-muted">
\t\t\t\t\t\t\t\t\t\t\t{it.estPrice != null ? `$${Number(it.estPrice).toLocaleString()}` : "—"}
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t<div className="flex gap-2">
\t\t\t\t\t\t\t\t\t\t\t<button className="text-blue-500 hover:underline" onClick={() => addToBudget(it.id)}>Add to Budget</button>
\t\t\t\t\t\t\t\t\t\t\t<button className="text-emerald-500 hover:underline" onClick={() => markOrdered(it.id)}>Mark Ordered</button>
\t\t\t\t\t\t\t\t\t\t\t<button className="text-indigo-500 hover:underline" onClick={() => openVendor(it.url)}>Open Vendor</button>
\t\t\t\t\t\t\t\t\t\t\t<button className="text-purple-500 hover:underline" onClick={() => addResource(it.id)}>Add Resource</button>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t))}
\t\t\t\t\t\t</div>
\t\t\t\t\t)}
\t\t\t\t</>
\t\t\t)}

\t\t\t{boardMode && (
\t\t\t\t<div className="space-y-4">
\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t<div className="text-sm text-muted">
\t\t\t\t\t\t\tTotals — Pending ${totals.PENDING.toLocaleString()} · Approved ${totals.APPROVED.toLocaleString()} · Purchased ${totals.PURCHASED.toLocaleString()}
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<label className="inline-flex items-center gap-2 text-sm">
\t\t\t\t\t\t\t<input type="checkbox" onChange={(e) => e.target.checked && toggleShareBoard(true)} disabled={!budgetId || sharing} />
\t\t\t\t\t\t\tShare
\t\t\t\t\t\t</label>
\t\t\t\t\t</div>
\t\t\t\t\t<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
\t\t\t\t\t\t{["PENDING", "APPROVED", "PURCHASED"].map((col) => (
\t\t\t\t\t\t\t<div key={col} className="rounded border bg-card text-card-foreground p-3">
\t\t\t\t\t\t\t\t<div className="flex items-center justify-between mb-2">
\t\t\t\t\t\t\t\t\t<div className="font-medium text-sm">{col}</div>
\t\t\t\t\t\t\t\t\t<div className="text-xs text-muted">${totals[col as keyof typeof totals].toLocaleString()}</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t<div className="space-y-2">
\t\t\t\t\t\t\t\t\t{items.filter((it) => (it.status || "PENDING") === col).map((it) => (
\t\t\t\t\t\t\t\t\t\t<div key={it.id} className="rounded border bg-background p-2">
\t\t\t\t\t\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t\t\t\t\t\t<div className="truncate pr-2">{it.title}</div>
\t\t\t\t\t\t\t\t\t\t\t\t<div className="text-xs text-muted">{it.estPrice != null ? `$${it.estPrice}` : "—"}</div>
\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t{items.filter((it) => (it.status || "PENDING") === col).length === 0 && (
\t\t\t\t\t\t\t\t\t\t<div className="text-xs text-muted">No items</div>
\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t))}
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t)}
\t\t</div>
\t);
}


