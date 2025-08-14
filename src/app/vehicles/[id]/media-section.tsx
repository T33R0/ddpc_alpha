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
  const canAddMore = media.length < 10;

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
				extraTile={
					<div className="aspect-[4/3] rounded-2xl border border-dashed border-neutral-700 flex items-center justify-center bg-neutral-900/50">
						<button
							type="button"
							className="text-sm px-3 py-2 rounded-md border disabled:opacity-50"
							disabled={!canAddMore}
							onClick={async () => {
								if (!canAddMore) return;
								try {
									const input = document.createElement('input');
									input.type = 'file';
									input.accept = 'image/*';
									input.onchange = async () => {
										const file = input.files?.[0];
										if (!file) return;
										const supabase = getBrowserSupabase();
										const path = `${vehicleId}/${Date.now()}_${file.name}`;
										const { error: upErr } = await supabase.storage.from('vehicle-media').upload(path, file, { upsert: true });
										if (upErr) throw new Error(upErr.message);
										success('Uploaded');
										location.reload();
									};
								input.click();
							} catch (e) {
								error(e instanceof Error ? e.message : 'Upload failed');
							}
						}}
						aria-label={canAddMore ? 'Add image' : 'Maximum images reached'}
						>
							<span className="opacity-70">+ Add Image</span>
						</button>
					</div>
				}
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


