import { createBrowserClient } from "@supabase/ssr";

function getProjectRef(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const [sub] = u.hostname.split(".");
    return sub || null;
  } catch {
    return null;
  }
}

function warnIfSharedProject(): void {
  try {
    const ref = getProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const key = `__sb_warn_ref_${ref}`;
    if (ref && typeof window !== "undefined" && !sessionStorage.getItem(key)) {
      // Heuristic only; cannot truly detect cross-env here
      if (location.hostname.includes("localhost") || location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        // Warn that using same project across dev/prod can share sessions
        console.warn("Using same Supabase project for dev and prod can share sessions.");
        sessionStorage.setItem(key, "1");
      }
    }
  } catch {
    // no-op
  }
}

export function getBrowserSupabase() {
  warnIfSharedProject();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
