"use client";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { getVehicleIdFromPath } from "@/lib/vehiclePath";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { info } = useToast();
  const vehicleId = getVehicleIdFromPath(pathname ?? "");
  const inVehicleContext = Boolean(vehicleId);

  const handleNavigate = (dest: "timeline" | "tasks") => (e: React.MouseEvent) => {
    e.preventDefault();
    if (inVehicleContext && vehicleId) {
      const target = dest === "timeline" ? `/vehicles/${vehicleId}/timeline` : `/vehicles/${vehicleId}/tasks`;
      router.push(target);
    } else {
      router.push("/vehicles");
      info("Pick a vehicle to view Timeline/Tasks.");
    }
  };
  return (
    <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">ddpc alpha</Link>
          <nav className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
            <Link href="/vehicles" className="hover:text-black">Vehicles</Link>
            <Link href="/about" className="hover:text-black">About</Link>
            {/* Always-on header nav with context-aware routing */}
            <Link
              href="/vehicles"
              onClick={handleNavigate("timeline")}
              className="hover:text-black"
              aria-label="Timeline"
              data-test="nav-timeline"
            >
              Timeline
            </Link>
            <Link
              href="/vehicles"
              onClick={handleNavigate("tasks")}
              className="hover:text-black"
              aria-label="Tasks"
              data-test="nav-tasks"
            >
              Tasks
            </Link>
          </nav>
        </div>
        <AuthButtons />
      </div>
    </header>
  );
}
