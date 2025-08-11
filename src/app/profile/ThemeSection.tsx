"use client";
import { useEffect, useId, useState, Suspense, startTransition } from "react";
import { serverLog } from "@/lib/serverLog";

type Theme = "system" | "light" | "dark";

interface ThemeSectionProps {
  initialTheme: Theme;
  userId: string;
}

async function updateTheme(theme: Theme): Promise<void> {
  document.documentElement.dataset.theme = theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
  await fetch("/api/profile/theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  });
}

function ThemeForm({ initialTheme, userId }: ThemeSectionProps) {
  const [value, setValue] = useState<Theme>(initialTheme);
  const [dirty, setDirty] = useState(false);
  const name = useId();

  useEffect(() => {
    const applied = initialTheme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : initialTheme;
    document.documentElement.dataset.theme = applied;
    serverLog("profile_theme_ui_init", { userId });
  }, [initialTheme, userId]);

  function onChange(next: Theme) {
    setValue(next);
    setDirty(true);
  }

  function onSave() {
    setDirty(false);
    startTransition(() => {
      updateTheme(value).catch(() => {});
    });
  }

  return (
    <fieldset className="space-y-3" data-testid="profile-theme-section">
      <legend className="text-sm font-medium">Theme</legend>
      <div role="radiogroup" aria-label="Theme" className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input data-testid="radio-theme-system" type="radio" name={name} value="system" checked={value === "system"} onChange={() => onChange("system")} className="accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
          <span>System</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input data-testid="radio-theme-light" type="radio" name={name} value="light" checked={value === "light"} onChange={() => onChange("light")} className="accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
          <span>Light</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input data-testid="radio-theme-dark" type="radio" name={name} value="dark" checked={value === "dark"} onChange={() => onChange("dark")} className="accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" />
          <span>Dark</span>
        </label>
        <button type="button" onClick={onSave} disabled={!dirty} className="ml-auto px-3 py-1 rounded border disabled:opacity-50">Save</button>
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


