import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

export async function getServerSupabase() {
  // Support both Next 14 (sync cookies()) and Next 15 (async cookies())
  const maybe = (cookies as unknown as () => any)();
  const cookieStore = typeof (maybe as any)?.then === "function" ? await maybe : maybe;
  // Heuristic warning: if running locally and using a hosted Supabase ref, sessions may be shared with prod
  try {
    if (process.env.NODE_ENV !== "production") {
      const ref = getProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
      if (ref) {
        console.warn("Using same Supabase project for dev and prod can share sessions.");
      }
    }
  } catch {
    // no-op
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}
