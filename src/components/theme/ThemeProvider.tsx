"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Theme = "system" | "light" | "dark";

export function ThemeProvider({ initialTheme, children }: { initialTheme: Theme; children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const mediaRef = useRef<MediaQueryList | null>(null);

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") {
      const isDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      return isDark ? "dark" : "light";
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    // Set dataset immediately on mount and whenever resolvedTheme changes
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    if (!window.matchMedia) return;
    mediaRef.current = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Recompute by toggling state to same value to trigger effect
      setTheme((t) => t);
    };
    mediaRef.current.addEventListener?.("change", handler);
    return () => mediaRef.current?.removeEventListener?.("change", handler);
  }, [theme]);

  return <>{children}</>;
}

export default ThemeProvider;


