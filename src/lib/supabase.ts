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

type CookieStore = { get(name: string): { value: string } | undefined };
type CookiesFnSync = () => CookieStore;
type CookiesFnAsync = () => Promise<CookieStore>;

function isPromise<T>(v: unknown): v is Promise<T> {
  return !!v && (typeof v === "object" || typeof v === "function") && "then" in (v as object);
}

export async function getServerSupabase() {
  // Support both Next 14 (sync cookies()) and Next 15 (async cookies())
  const fn = cookies as unknown as CookiesFnSync | CookiesFnAsync;
  const result = fn();
  const cookieStore: CookieStore = isPromise<CookieStore>(result) ? await result : result;
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
