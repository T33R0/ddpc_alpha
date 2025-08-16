"use client";

export default function VehicleTabs({ vehicleId }: { vehicleId: string }) {
  const items: Array<{ href: string; label: string; internal?: boolean }> = [
    { href: `#overview`, label: "Overview", internal: true },
    { href: `#timeline`, label: "Timeline", internal: true },
    { href: `#tasks`, label: "Tasks", internal: true },
    { href: `#build-plans`, label: "Build Plans", internal: true },
    { href: `#gallery`, label: "Gallery", internal: true },
    // Parts stub can map to plans or future parts route if added
    { href: `#parts`, label: "Parts", internal: true },
    { href: `/v/${vehicleId}`, label: "Display Page", internal: false },
  ];

  return (
    <nav className="-mx-3 px-3 bg-bg/80 backdrop-blur border-b">
      <ul className="flex gap-6 h-12 items-end">
        {items.map((it) => (
          <li key={it.href} className="h-full flex items-end">
            <a
              href={it.href}
              className="text-sm pb-3 transition-colors text-muted hover:text-fg"
              {...(it.internal ? { 'data-veh-nav': true, 'data-target': it.label.toLowerCase().replace(/\s+/g, '-') } : {})}
            >
              {it.label}
              <span
                className="block h-[2px] mt-2 rounded-full transition-all duration-200 bg-transparent w-0"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}


