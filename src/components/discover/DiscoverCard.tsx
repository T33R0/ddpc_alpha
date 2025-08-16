"use client";

import Image from "next/image";

export default function DiscoverCard({
	title,
	imageSrc,
	stats,
}: {
	title: string;
	imageSrc: string;
	stats: { power: string; engine: string; weight: string; drive: string };
}) {
	return (
		<div className="overflow-hidden rounded-lg border">
			<div className="relative aspect-[16/9] bg-gray-100">
				<Image src={imageSrc} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" unoptimized />
			</div>
			<div className="p-4">
				<h3 className="mb-2 font-semibold">{title}</h3>
				<div className="grid grid-cols-4 gap-3 text-xs text-gray-600">
					<div>
						<div className="uppercase text-[10px] text-gray-500">Power</div>
						<div className="font-medium text-gray-900">{stats.power}</div>
					</div>
					<div>
						<div className="uppercase text-[10px] text-gray-500">Engine</div>
						<div className="font-medium text-gray-900">{stats.engine}</div>
					</div>
					<div>
						<div className="uppercase text-[10px] text-gray-500">Weight</div>
						<div className="font-medium text-gray-900">{stats.weight}</div>
					</div>
					<div>
						<div className="uppercase text-[10px] text-gray-500">Drive</div>
						<div className="font-medium text-gray-900">{stats.drive}</div>
					</div>
				</div>
				<div className="mt-3 flex gap-2">
					<button className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white">Save Vehicle</button>
					<button className="rounded border px-3 py-1 text-sm font-medium">Compare</button>
				</div>
			</div>
		</div>
	);
}


