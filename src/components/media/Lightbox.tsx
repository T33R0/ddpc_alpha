"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { cubicEasing, motionDurations, usePrefersReducedMotion } from "@/lib/motion";

type LightboxProps = {
	open: boolean;
	index: number;
	items: { id: string; fullSrc: string; alt?: string }[];
	onClose: () => void;
	onPrev: () => void;
	onNext: () => void;
};

export default function Lightbox({ open, index, items, onClose, onPrev, onNext }: LightboxProps) {
	const overlayRef = useRef<HTMLDivElement>(null);
	const current = items[index];
  const reduced = usePrefersReducedMotion();

	// Keyboard controls
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft") onPrev();
			if (e.key === "ArrowRight") onNext();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose, onPrev, onNext]);

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					ref={overlayRef}
					role="dialog"
					aria-modal="true"
					aria-label="Image viewer"
					className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={(e) => {
						if (e.target === overlayRef.current) onClose();
					}}
				>
					<div className="absolute inset-0 flex items-center justify-center p-4">
						<motion.div
							key={current.id}
							initial={{ opacity: 0, x: reduced ? 0 : 24 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: reduced ? 0 : -24 }}
							transition={{ duration: motionDurations.page, ease: cubicEasing }}
							className="relative max-w-6xl w-full aspect-[16/9]"
						>
							<Image
								src={current.fullSrc}
								alt={current.alt ?? ""}
								fill
								className="object-contain"
								sizes="100vw"
								priority
							/>
						</motion.div>
					</div>

					{/* Controls */}
					<div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
						<button onClick={onClose} className="rounded-xl bg-white/10 px-3 py-1.5 text-white hover:bg-white/20">Close</button>
						<div className="rounded-xl bg-white/10 px-3 py-1.5 text-white text-sm">{index + 1} / {items.length}</div>
					</div>
					<div className="absolute inset-y-0 left-0 flex items-center p-4">
						<button onClick={onPrev} className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Previous">⟵</button>
					</div>
					<div className="absolute inset-y-0 right-0 flex items-center p-4">
						<button onClick={onNext} className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Next">⟶</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}


