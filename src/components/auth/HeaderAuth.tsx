"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function HeaderAuth() {
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => { sub.data.subscription.unsubscribe(); document.removeEventListener("mousedown", onDoc); };
  }, [supabase]);

  if (!email) {
    return (
      <Link href="/api/auth/signin" className="px-3 py-1 rounded border bg-white hover:bg-gray-50" data-testid="btn-signin">Sign in</Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setMenuOpen(o => !o)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center" aria-haspopup="menu" aria-expanded={menuOpen} data-testid="menu-avatar">
        <span className="text-xs">{email[0]?.toUpperCase?.() || "U"}</span>
      </button>
      {menuOpen && (
        <div role="menu" className="absolute right-0 mt-2 w-40 rounded border bg-white shadow">
          <Link role="menuitem" className="block px-3 py-2 text-sm hover:bg-gray-50" href="/profile">Profile</Link>
          <Link role="menuitem" className="block px-3 py-2 text-sm hover:bg-gray-50" href="/vehicles" data-testid="nav-garage">Garage</Link>
          <button role="menuitem" className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}


