"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { User as UserIcon } from "lucide-react";

export default function HeaderAuth() {
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      const uid = session?.user?.id;
      if (uid) {
        (async () => {
          try {
            const { data } = await supabase
              .from("user_profile")
              .select("avatar_url")
              .eq("user_id", uid)
              .maybeSingle();
            setAvatarUrl((data as { avatar_url?: string } | null)?.avatar_url ?? null);
          } catch {
            setAvatarUrl(null);
          }
        })();
      } else {
        setAvatarUrl(null);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      const uid = data.session?.user?.id;
      if (uid) {
        try {
          const { data: row } = await supabase
            .from("user_profile")
            .select("avatar_url")
            .eq("user_id", uid)
            .maybeSingle();
          setAvatarUrl((row as { avatar_url?: string } | null)?.avatar_url ?? null);
        } catch {
          setAvatarUrl(null);
        }
      }
    });
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => { sub.data.subscription.unsubscribe(); document.removeEventListener("mousedown", onDoc); };
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
        <UserIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setMenuOpen(o => !o)} className="w-8 h-8 rounded-full bg-card text-fg border overflow-hidden flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]" aria-haspopup="menu" aria-expanded={menuOpen} data-testid="menu-avatar" aria-label="Account menu">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <UserIcon className="w-5 h-5" />
        )}
      </button>
      {menuOpen && (
        <div role="menu" className="absolute right-0 mt-2 w-40 rounded border bg-card text-fg shadow">
          <Link role="menuitem" className="block px-3 py-2 text-sm hover:bg-bg/60" href="/profile">Profile</Link>
          <Link role="menuitem" className="block px-3 py-2 text-sm hover:bg-bg/60" href="/vehicles" data-testid="nav-garage">Garage</Link>
          <button role="menuitem" className="w-full text-left px-3 py-2 text-sm hover:bg-bg/60" onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}


