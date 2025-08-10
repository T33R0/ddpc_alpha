"use client";
import Link from "next/link";
import HeaderAuth from "@/components/auth/HeaderAuth";
import { Badge } from "@/components/ui/Badge";
import CommandPalette from "@/components/CommandPalette";
import { Suspense } from "react";

export default function Header() {
  return (
    <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-40 text-fg">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold" data-testid="brand-ddpc">DDPC Alpha</Link>
          <nav className="flex items-center gap-3 text-sm text-muted">
            <Link href="/vehicles" className="hover:text-fg" data-testid="nav-garage">Garage</Link>
            <Link href="/about" className="hover:text-fg" data-testid="nav-about">About</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Badge aria-label="alpha badge">alpha</Badge>
          <HeaderAuth />
        </div>
      </div>
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
    </header>
  );
}
