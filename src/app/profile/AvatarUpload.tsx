"use client";
import { useRef, useState } from "react";

export default function AvatarUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function onPick() {
    inputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      if (res.redirected) {
        // API redirects back to profile on success
        window.location.href = res.url;
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "upload_failed");
      }
    } catch (err) {
      console.error(err);
      alert("Avatar upload failed");
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
    </div>
  );
}
