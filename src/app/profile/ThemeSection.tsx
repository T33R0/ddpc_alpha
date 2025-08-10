"use client";
import { useEffect, useId, useState, Suspense, startTransition } from "react";
import { serverLog } from "@/lib/serverLog";

type Theme = "system" | "light" | "dark";

async function updateTheme(theme: Theme): Promise<void> {
  // Optimistic: update immediately
  document.documentElement.dataset.theme = theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
  // Persist via server action route
  await fetch("/api/profile/theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  });
}

function ThemeForm() {
  const [value, setValue] = useState<Theme>(() => {
    const current = document.documentElement.dataset.theme;
    // We can't detect 'system' reliably from dataset; default to 'system'
    if (current === "light" || current === "dark") return current;
    return "system";
  });
  const name = useId();

  useEffect(() => {
    serverLog("profile_theme_ui_init");
  }, []);

  function onChange(next: Theme) {
    setValue(next);
    startTransition(() => {
      updateTheme(next).catch(() => {});
    });
  }

  return (
    <fieldset className="space-y-3" data-testid="profile-theme-section">
      <legend className="text-sm font-medium">Theme</legend>
      <div role="radiogroup" aria-label="Theme">
        <label className="inline-flex items-center gap-2 mr-4">
          <input data-testid="radio-theme-system" type="radio" name={name} value="system" checked={value === "system"} onChange={() => onChange("system")} className="accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
          <span>System</span>
        </label>
        <label className="inline-flex items-center gap-2 mr-4">
          <input data-testid="radio-theme-light" type="radio" name={name} value="light" checked={value === "light"} onChange={() => onChange("light")} className="accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
          <span>Light</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input data-testid="radio-theme-dark" type="radio" name={name} value="dark" checked={value === "dark"} onChange={() => onChange("dark")} className="accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
          <span>Dark</span>
        </label>
      </div>
    </fieldset>
  );
}

export default function ThemeSection() {
  return (
    <Suspense fallback={null}>
      <ThemeForm />
    </Suspense>
  );
}


