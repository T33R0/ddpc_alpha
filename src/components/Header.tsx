"use client";
import Link from "next/link";
import HeaderAuth from "@/components/auth/HeaderAuth";
import CommandPalette from "@/components/CommandPalette";
import { Suspense } from "react";
import Image from "next/image";
import LogoPng from "../../media/branding/Fiverr Premium Kit/Favicon/Wordpress Transparent.png";

export default function Header() {
  return (
    <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-40 text-fg">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center" data-testid="brand-ddpc" aria-label="ddpc home">
            <Image src={LogoPng} alt="ddpc" height={32} className="h-8 w-auto" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/discover" className="text-sm text-muted hover:text-fg" aria-label="Discover">Discover</Link>
          <Link href="/about" className="text-sm text-muted hover:text-fg" aria-label="About ddpc">ddpc?</Link>
          <HeaderAuth />
        </div>
      </div>
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
    </header>
  );
}
