"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { Contact } from "lucide-react";

export default function HeaderAuth() {
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });
    return () => { sub.data.subscription.unsubscribe(); };
  }, [supabase]);

  if (!email) {
    return (
      <button
        type="button"
        className="inline-flex items-center justify-center text-fg hover:opacity-80"
        aria-label="Sign in"
        data-testid="btn-signin"
        onClick={async () => {
          const origin = window.location.origin;
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${origin}/auth/callback` },
          });
        }}
      >
        <Contact className="w-6 h-6" />
      </button>
    );
  }

  return (
    <Link href="/profile" aria-label="Profile" className="inline-flex items-center justify-center text-fg hover:opacity-80">
      <Contact className="w-6 h-6" />
    </Link>
  );
}


