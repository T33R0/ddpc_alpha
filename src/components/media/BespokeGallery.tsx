"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { motionDurations } from "@/lib/motion";

type MediaItem = {
	id: string;
	src: string;
	fullSrc: string;
	alt?: string;
	vehicleId?: string;
	eventId?: string;
};

export default function BespokeGallery({
	items,
	onOpenLightbox,
	onQuickAction,
}: {
	items: MediaItem[];
	onOpenLightbox: (index: number) => void;
	onQuickAction?: (id: string, action: "setHero" | "tagPart" | "delete") => void;
}) {
	const [hoverId, setHoverId] = useState<string | null>(null);

	return (
		<div
			className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
			role="list"
			aria-label="Media gallery"
		>
			{items.map((m, i) => (
				<motion.button
					key={m.id}
					type="button"
					role="listitem"
					onClick={() => onOpenLightbox(i)}
					onMouseEnter={() => setHoverId(m.id)}
					onMouseLeave={() => setHoverId(null)}
					className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-neutral-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
					whileHover={{ y: -2 }}
					transition={{ duration: motionDurations.micro }}
					aria-label={m.alt ?? "Open image"}
				>
					<Image
						src={m.src}
						alt={m.alt ?? ""}
						fill
						sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
						className="object-cover"
						priority={i < 4}
					/>
					{/* Light sweep */}
					<div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
						<div className="absolute -inset-x-1/2 -inset-y-1 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 animate-[pulse_1.5s_linear_infinite]" />
					</div>

					{/* Quick actions on hover */}
					{hoverId === m.id && (
						<div className="absolute bottom-2 right-2 flex gap-2">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onQuickAction?.(m.id, "setHero");
								}}
								className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
							>
								Set as hero
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onQuickAction?.(m.id, "tagPart");
								}}
								className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
							>
								Tag part
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onQuickAction?.(m.id, "delete");
								}}
								className="rounded-lg bg-red-600/70 px-2 py-1 text-xs text-white hover:bg-red-700/80"
							>
								Delete
							</button>
						</div>
					)}
				</motion.button>
			))}
		</div>
	);
}


