"use client";
import React from "react";

export function SpendBreakdownChart({ data }: { data: { service: number; mods: number; fuel?: number } }) {
  const parts = [
    { label: "Service", value: data.service, color: "#60a5fa" },
    { label: "Mods", value: data.mods, color: "#34d399" },
  ];
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div data-testid="chart-spend" className="w-full">
      <div className="flex h-4 w-full overflow-hidden rounded">
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, backgroundColor: p.color }} />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded" style={{ backgroundColor: p.color }} />
            <span>{p.label}</span>
            <strong>{formatCurrency(p.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MilesTrendChart({ points }: { points: Array<{ month: string; value: number }> }) {
  // Minimal sparkline-like rendering using SVG
  const width = 480;
  const height = 80;
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = width / Math.max(1, points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = height - (p.value / max) * height;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return (
    <svg data-testid="chart-miles" viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
      <path d={d} fill="none" stroke="#0ea5e9" strokeWidth={2} />
      <line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke="#e5e7eb" />
    </svg>
  );
}

function formatCurrency(n: number): string {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); } catch { return `$${Math.round(n)}`; }
}


