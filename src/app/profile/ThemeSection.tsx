"use client";
import { useEffect, useId, useState, Suspense, startTransition } from "react";
import { serverLog } from "@/lib/serverLog";

type Theme = "system" | "light" | "dark";

interface ThemeSectionProps {
  initialTheme: Theme;
  userId: string;
}

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

function ThemeForm({ initialTheme, userId }: ThemeSectionProps) {
  const [value, setValue] = useState<Theme>(initialTheme);
  const name = useId();

  useEffect(() => {
    // apply initial theme to document for consistency on first render
    const applied = initialTheme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : initialTheme;
    document.documentElement.dataset.theme = applied;
    serverLog("profile_theme_ui_init", { userId });
  }, [initialTheme, userId]);

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

export default function ThemeSection({ initialTheme, userId }: ThemeSectionProps) {
  return (
    <Suspense fallback={null}>
      <ThemeForm initialTheme={initialTheme} userId={userId} />
    </Suspense>
  );
}


