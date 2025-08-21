"use client";
import Link from "next/link";
import HeaderAuth from "@/components/auth/HeaderAuth";
import CommandPalette from "@/components/CommandPalette";
import { Suspense } from "react";
import Image from "next/image";
import LogoPng from "../../media/branding/Fiverr Premium Kit/Favicon/Wordpress Transparent.png";
import { Warehouse } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-40 text-fg">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-center">
        <nav className="flex items-center gap-8">
          <Link href="/vehicles" className="inline-flex items-center" aria-label="Garage" data-testid="nav-garage">
            <Warehouse className="w-6 h-6" />
          </Link>
          <Link href="/" className="inline-flex items-center" data-testid="brand-ddpc" aria-label="ddpc home">
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
