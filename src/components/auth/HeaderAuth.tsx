"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { User as UserIcon } from "lucide-react";

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
        <UserIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <Link href="/profile" aria-label="Profile" className="inline-flex items-center justify-center text-fg hover:opacity-80">
      <UserIcon className="w-5 h-5" />
    </Link>
  );
}


