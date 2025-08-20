"use client";

import { useEffect, useState } from "react";

type Receipt = {
  id: string;
  vendor_name: string;
  shop_type: "DEALER" | "INDEPENDENT";
  occurred_on: string;
  total: number;
  invoice_file?: string | null;
};

export default function VehicleReceiptsPage({ params }: { params: { id: string } }) {
  const vehicleId = params.id;
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Placeholder: fetch receipts later from GET /api/receipts?vehicleId=
    setReceipts([]);
  }, [vehicleId]);

  function badge(type: Receipt["shop_type"]) {
    const cls = type === "DEALER" ? "bg-fuchsia-500/15 text-fuchsia-400" : "bg-sky-500/15 text-sky-400";
    return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{type === "DEALER" ? "Dealer" : "Indie"}</span>;
  }

  async function attachInvoice(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/receipts/${id}/upload-url`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to get upload URL");
      // In a real flow you'd PUT/POST the file to data.url; here we just alert
      alert(`Upload URL: ${data.url}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const totalSum = receipts.reduce((acc, r) => acc + Number(r.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Receipts</h1>
        <div className="text-sm text-muted">Total ${totalSum.toLocaleString()}</div>
      </div>

      {receipts.length === 0 ? (
        <div className="text-muted">No receipts yet.</div>
      ) : (
        <ul className="space-y-2">
          {receipts.map((r) => (
            <li key={r.id} className="rounded border bg-card text-card-foreground p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {badge(r.shop_type)}
                  <div className="truncate">
                    <div className="font-medium truncate">{r.vendor_name}</div>
                    <div className="text-xs text-muted">{new Date(r.occurred_on).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-medium">${Number(r.total).toLocaleString()}</div>
                  {r.invoice_file ? (
                    <button className="text-blue-500 hover:underline" onClick={() => setPreviewId(previewId === r.id ? null : r.id)}>
                      {previewId === r.id ? "Hide Invoice" : "View Invoice"}
                    </button>
                  ) : (
                    <button className="text-emerald-500 hover:underline disabled:opacity-50" onClick={() => attachInvoice(r.id)} disabled={busy}>Attach Invoice</button>
                  )}
                </div>
              </div>
              {previewId === r.id && r.invoice_file && (
                <div className="mt-3 rounded border bg-background p-2">
                  <iframe src={r.invoice_file} className="w-full h-[60vh] rounded" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
