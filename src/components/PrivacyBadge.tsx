"use client";

export default function PrivacyBadge({ value }: { value?: string | null }) {
  const effective = value ?? "PRIVATE";
  const isPublic = effective === "PUBLIC";
  const cls = `text-xs px-2 py-0.5 rounded border ${isPublic ? "bg-card text-fg" : "bg-card text-muted"}`;
  return <span className={cls} data-testid="vehicle-privacy-badge">{isPublic ? "Public" : "Private"}</span>;
}
