"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function VehicleTabs({ vehicleId }: { vehicleId: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/vehicles/${vehicleId}`, label: "Overview" },
    { href: `/vehicles/${vehicleId}/timeline`, label: "Timeline" },
    { href: `/vehicles/${vehicleId}/tasks`, label: "Tasks" },
    { href: `/vehicles/${vehicleId}/plans`, label: "Build Plans" },
    { href: `/vehicles/${vehicleId}/media`, label: "Media" },
    // Parts stub can map to plans or future parts route if added
    { href: `/vehicles/${vehicleId}/plans`, label: "Parts" },
    { href: `/v/${vehicleId}`, label: "Display Page" },
  ];

  return (
    <nav className="-mx-3 px-3 bg-bg/80 backdrop-blur border-b">
      <ul className="flex gap-6 h-12 items-end">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href} className="h-full flex items-end">
              <Link
                href={it.href}
                className={`text-sm pb-3 transition-colors ${active ? "text-fg" : "text-muted hover:text-fg"}`}
              >
                {it.label}
                <span
                  className={`block h-[2px] mt-2 rounded-full transition-all duration-200 ${active ? "bg-fg w-full" : "bg-transparent w-0"}`}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


