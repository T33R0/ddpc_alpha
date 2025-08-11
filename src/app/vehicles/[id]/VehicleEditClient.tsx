"use client";
import { useRef, useState } from "react";

type Initial = {
  nickname: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  privacy: string | null;
};

export default function VehicleEditClient({ vehicleId, initial }: { vehicleId: string; initial: Initial }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: "PATCH", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to update");
      // refresh the page to reflect updates
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function onPickImage() {
    fileRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/vehicles/${vehicleId}/photo`, { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || "Upload failed");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-4">
      <div className="text-base font-semibold mb-3">Edit Vehicle</div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs text-muted">Nickname</label>
          <input name="nickname" defaultValue={initial.nickname ?? ""} className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
        </div>
        <div>
          <label className="text-xs text-muted">Year</label>
          <input type="number" name="year" defaultValue={initial.year ?? undefined} className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
        </div>
        <div>
          <label className="text-xs text-muted">Make</label>
          <input name="make" defaultValue={initial.make ?? ""} className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
        </div>
        <div>
          <label className="text-xs text-muted">Model</label>
          <input name="model" defaultValue={initial.model ?? ""} className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
        </div>
        <div>
          <label className="text-xs text-muted">Trim</label>
          <input name="trim" defaultValue={initial.trim ?? ""} className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
        </div>
        <div>
          <label className="text-xs text-muted">Privacy</label>
          <select name="privacy" defaultValue={(initial.privacy || "PRIVATE").toUpperCase()} className="w-full border rounded px-2 py-1 bg-bg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
            <option value="PRIVATE">Private</option>
            <option value="PUBLIC">Public</option>
          </select>
        </div>
        <div className="md:col-span-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onPickImage} className="px-3 py-1 rounded border bg-bg text-fg">Upload image</button>
          <button type="submit" disabled={busy} className="px-3 py-1 rounded bg-brand text-white disabled:opacity-50">{busy ? "Saving..." : "Save"}</button>
        </div>
      </form>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  );
}


