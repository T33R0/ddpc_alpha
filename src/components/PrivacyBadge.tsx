"use client";

export default function PrivacyBadge({ value }: { value?: string | null }) {
  if (!value) return null;
  const isPublic = value === "PUBLIC";
  const cls = `text-xs px-2 py-0.5 rounded border ${isPublic ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}`;
  return <span className={cls}>{value}</span>;
}
