"use client";
import { useState } from "react";

export default function CopyLink() {
  const [copied, setCopied] = useState(false);
  const href = typeof window !== "undefined" ? window.location.href : "";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="text-sm border rounded px-2 py-1 bg-white hover:bg-gray-50"
      aria-label="Copy share link"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
