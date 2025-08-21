"use client";

export default function VehicleTabs({ vehicleId }: { vehicleId: string }) {
	const items: Array<{ href: string; label: string; internal?: boolean; target?: string }> = [
		{ href: `#overview`, label: "Overview", internal: true },
		{ href: `#wishlist`, label: "Wishlist", internal: true },
		{ href: `#jobs`, label: "Jobs", internal: true },
		{ href: `#timeline`, label: "Timeline", internal: true },
		{ href: `#gallery`, label: "Gallery", internal: true },
		{ href: `#receipts`, label: "Receipts", internal: true },
		{ href: `#specs`, label: "Specs", internal: true, target: "display-page" },
	];

	return (
		<nav className="-mx-3 px-3 bg-bg/80 backdrop-blur border-b">
			<ul className="flex gap-6 h-12 items-end">
				{items.map((it) => (
					<li key={it.href} className="h-full flex items-end">
						<a
							href={it.href}
							className="text-sm pb-3 transition-colors text-muted hover:text-fg"
							{...(it.internal ? { 'data-veh-nav': true, 'data-target': it.target ?? it.label.toLowerCase().replace(/\s+/g, '-') } : {})}
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


