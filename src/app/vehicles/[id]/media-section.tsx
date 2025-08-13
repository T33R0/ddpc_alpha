"use client";
import { useState } from "react";
import BespokeGallery from "@/components/media/BespokeGallery";
import Lightbox from "@/components/media/Lightbox";

export type MediaThumb = { id: string; src: string; fullSrc: string; alt?: string };

export default function MediaSection({ media }: { media: MediaThumb[] }) {
	const [lbOpen, setLbOpen] = useState(false);
	const [lbIndex, setLbIndex] = useState(0);

	return (
		<>
			<BespokeGallery
				items={media}
				onOpenLightbox={(i) => { setLbIndex(i); setLbOpen(true); }}
				onQuickAction={(id, action) => {
					// TODO: call API to set hero / tag part, then toast
				}}
			/>
			<Lightbox
				open={lbOpen}
				index={lbIndex}
				items={media.map(m => ({ id: m.id, fullSrc: m.fullSrc, alt: m.alt }))}
				onClose={() => setLbOpen(false)}
				onPrev={() => setLbIndex((i) => (i - 1 + media.length) % media.length)}
				onNext={() => setLbIndex((i) => (i + 1) % media.length)}
			/>
		</>
	);
}


