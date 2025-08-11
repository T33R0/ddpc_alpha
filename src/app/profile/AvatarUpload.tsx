"use client";
import { useRef, useState } from "react";

export default function AvatarUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick() {
    inputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({ ok: false, error: 'invalid_response' }));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'upload_failed');
      }
      // Force refresh to show new avatar
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'upload_failed';
      setError(message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      <button type="button" onClick={onPick} disabled={uploading} className="px-2 py-1 rounded border disabled:opacity-50">
        {uploading ? "Uploading..." : "Upload avatar"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
