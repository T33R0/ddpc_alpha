"use client";
import { useState } from "react";

export default function CopyToClipboard({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <button type="button" onClick={onCopy} className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-50" aria-label="Copy to clipboard">
      {copied ? "Copied!" : label}
    </button>
  );
}


