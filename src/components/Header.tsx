"use client";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import VehicleSwitcher from "@/components/vehicle/VehicleSwitcher";
import CommandPalette from "@/components/CommandPalette";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { getVehicleIdFromPath } from "@/lib/vehiclePath";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const vehicleId = getVehicleIdFromPath(pathname ?? "");
  const inVehicleContext = Boolean(vehicleId);

  const handleNavigate = (dest: "timeline" | "tasks") => (e: React.MouseEvent) => {
    e.preventDefault();
    if (inVehicleContext && vehicleId) {
      const target = dest === "timeline" ? `/vehicles/${vehicleId}/timeline` : `/vehicles/${vehicleId}/tasks`;
      router.push(target);
    } else {
      const target = dest === "timeline" ? "/timeline" : "/tasks";
      router.push(target);
    }
  };
  return (
    <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">ddpc alpha</Link>
          <nav className="flex items-center gap-3 text-sm text-gray-600">
            <Link href="/vehicles" className="hover:text-black">Vehicles</Link>
            <Link href="/about" className="hover:text-black">About</Link>
            {/* Always-on header nav with context-aware routing */}
            <Link
              href="/timeline"
              onClick={handleNavigate("timeline")}
              className="hover:text-black"
              aria-label="Timeline"
              data-testid="nav-timeline"
            >
              Timeline
            </Link>
            <Link
              href="/tasks"
              onClick={handleNavigate("tasks")}
              className="hover:text-black"
              aria-label="Tasks"
              data-testid="nav-tasks"
            >
              Tasks
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <VehicleSwitcher />
          </Suspense>
          <AuthButtons />
        </div>
      </div>
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
    </header>
  );
}
