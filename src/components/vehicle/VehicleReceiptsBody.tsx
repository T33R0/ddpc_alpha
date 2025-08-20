"use client";

import { useEffect, useState } from "react";

type Receipt = {
\tid: string;
\tvendor_name: string;
\tshop_type: "DEALER" | "INDEPENDENT";
\toccurred_on: string;
\ttotal: number;
\tinvoice_file?: string | null;
};

export default function VehicleReceiptsBody({ vehicleId }: { vehicleId: string }) {
\tconst [receipts, setReceipts] = useState<Receipt[]>([]);
\tconst [previewId, setPreviewId] = useState<string | null>(null);
\tconst [busy, setBusy] = useState(false);

\tuseEffect(() => {
\t\tsetReceipts([]);
\t}, [vehicleId]);

\tfunction badge(type: Receipt["shop_type"]) {
\t\tconst cls = type === "DEALER" ? "bg-fuchsia-500/15 text-fuchsia-400" : "bg-sky-500/15 text-sky-400";
\t\treturn <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{type === "DEALER" ? "Dealer" : "Indie"}</span>;
\t}

\tasync function attachInvoice(id: string) {
\t\tsetBusy(true);
\t\ttry {
\t\t\tconst res = await fetch(`/api/receipts/${id}/upload-url`, { method: "POST" });
\t\t\tconst data = await res.json();
\t\t\tif (!res.ok) throw new Error(data?.error || "Failed to get upload URL");
\t\t\talert(`Upload URL: ${data.url}`);
\t\t} catch (e) {
\t\t\talert((e as Error).message);
\t\t} finally {
\t\t\tsetBusy(false);
\t\t}
\t}

\tconst totalSum = receipts.reduce((acc, r) => acc + Number(r.total || 0), 0);

\treturn (
\t\t<div className="space-y-6">
\t\t\t<div className="flex items-center justify-between">
\t\t\t\t<h1 className="text-2xl font-semibold">Receipts</h1>
\t\t\t\t<div className="text-sm text-muted">Total ${totalSum.toLocaleString()}</div>
\t\t\t</div>

\t\t\t{receipts.length === 0 ? (
\t\t\t\t<div className="text-muted">No receipts yet.</div>
\t\t\t) : (
\t\t\t\t<ul className="space-y-2">
\t\t\t\t\t{receipts.map((r) => (
\t\t\t\t\t\t<li key={r.id} className="rounded border bg-card text-card-foreground p-3">
\t\t\t\t\t\t\t<div className="flex items-center justify-between gap-3">
\t\t\t\t\t\t\t\t<div className="flex items-center gap-3 min-w-0">
\t\t\t\t\t\t\t\t\t{badge(r.shop_type)}
\t\t\t\t\t\t\t\t\t<div className="truncate">
\t\t\t\t\t\t\t\t\t\t<div className="font-medium truncate">{r.vendor_name}</div>
\t\t\t\t\t\t\t\t\t\t<div className="text-xs text-muted">{new Date(r.occurred_on).toLocaleDateString()}</div>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t\t\t<div className="font-medium">${Number(r.total).toLocaleString()}</div>
\t\t\t\t\t\t\t\t\t{r.invoice_file ? (
\t\t\t\t\t\t\t\t\t\t<button className="text-blue-500 hover:underline" onClick={() => setPreviewId(previewId === r.id ? null : r.id)}>
\t\t\t\t\t\t\t\t\t\t\t{previewId === r.id ? "Hide Invoice" : "View Invoice"}
\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t) : (
\t\t\t\t\t\t\t\t\t\t<button className="text-emerald-500 hover:underline disabled:opacity-50" onClick={() => attachInvoice(r.id)} disabled={busy}>Attach Invoice</button>
\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t{previewId === r.id && r.invoice_file && (
\t\t\t\t\t\t\t\t<div className="mt-3 rounded border bg-background p-2">
\t\t\t\t\t\t\t\t\t<iframe src={r.invoice_file} className="w-full h-[60vh] rounded" />
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t)}
\t\t\t\t\t\t</li>
\t\t\t\t\t))}
\t\t\t\t</ul>
\t\t\t)}
\t\t</div>
\t);
}


