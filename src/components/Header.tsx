"use client";
import Link from "next/link";
import HeaderAuth from "@/components/auth/HeaderAuth";
import CommandPalette from "@/components/CommandPalette";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import LogoPng from "../../media/branding/Fiverr Premium Kit/Favicon/Wordpress Transparent.png";
import { Users } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function Header() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsSignedIn(!!session);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [supabase]);
  return (
    <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-40 text-fg">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-center">
        <nav className="flex items-center gap-8">
          <Link href="/community" className="inline-flex items-center" aria-label="Community" data-testid="nav-community">
            <Users className="w-6 h-6" />
          </Link>
          <Link href={isSignedIn ? "/dashboard" : "/"} className="inline-flex items-center" data-testid="brand-ddpc" aria-label={isSignedIn ? "Dashboard" : "Home"}>
            <Image src={LogoPng} alt="ddpc" height={40} className="h-10 w-auto" />
          </Link>
          <HeaderAuth />
        </nav>
      </div>
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
    </header>
  );
}
