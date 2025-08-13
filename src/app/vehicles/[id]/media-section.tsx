"use client";
import { useMemo, useState } from "react";
import BespokeGallery from "@/components/media/BespokeGallery";
import Lightbox from "@/components/media/Lightbox";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useToast } from "@/components/ui/ToastProvider";
import { updateVehiclePhoto } from "@/app/vehicles/actions";

export type MediaThumb = { id: string; src: string; fullSrc: string; alt?: string };

export default function MediaSection({ media, vehicleId }: { media: MediaThumb[]; vehicleId: string }) {
	const [lbOpen, setLbOpen] = useState(false);
	const [lbIndex, setLbIndex] = useState(0);
  const { success, error } = useToast();
  const idToItem = useMemo(() => new Map(media.map(m => [m.id, m])), [media]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	return (
		<>
			<BespokeGallery
				items={media}
				onOpenLightbox={(i) => { setLbIndex(i); setLbOpen(true); }}
				onQuickAction={async (id, action) => {
					if (action === "setHero") {
						const item = idToItem.get(id);
						if (!item) return;
						const res = await updateVehiclePhoto(vehicleId, item.fullSrc);
						if ((res as { error?: string }).error) error("Failed to set hero");
						else success("Set as hero");
						return;
					}
					if (action === "tagPart") {
						// Placeholder: open part tagging when available
						success("Tagging coming soon");
					}
					if (action === "delete") {
						setConfirmDeleteId(id);
					}
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

			<ConfirmDialog
				open={!!confirmDeleteId}
				title="Delete media?"
				description="This will permanently remove the file from storage."
				confirmLabel="Delete"
				onCancel={() => setConfirmDeleteId(null)}
				onConfirm={async () => {
					if (!confirmDeleteId) return;
					try {
						const supabase = getBrowserSupabase();
						const { error: delErr } = await supabase.storage.from("vehicle-media").remove([confirmDeleteId]);
						if (delErr) throw new Error(delErr.message);
						success("Deleted");
						setConfirmDeleteId(null);
						// Force reload to refresh media list cheaply
						location.reload();
					} catch (e) {
						error(e instanceof Error ? e.message : "Failed to delete");
					}
				}}
			/>
		</>
	);
}


