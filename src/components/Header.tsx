"use client";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  // Detect /vehicles/[id] or /vehicles/[id]/*
  const match = pathname?.match(/^\/vehicles\/([^\/]+)(?:\/.*)?$/);
  const vehicleId = match?.[1];
  const inVehicleContext = Boolean(vehicleId);
  return (
    <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">ddpc alpha</Link>
          <nav className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
            <Link href="/vehicles" className="hover:text-black">Vehicles</Link>
            <Link href="/about" className="hover:text-black">About</Link>
            {inVehicleContext && (
              <Link
                href={`/vehicles/${vehicleId}/timeline`}
                className="hover:text-black"
                aria-label="Vehicle Timeline"
                data-test="nav-timeline"
              >
                Timeline
              </Link>
            )}
          </nav>
        </div>
        <AuthButtons />
      </div>
    </header>
  );
}
