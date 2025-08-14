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

  async function resizeToWebp(file: File, maxSize = 2000, quality = 0.85): Promise<Blob> {
    // Try createImageBitmap for performance; fall back to Image
    const bitmap = await createImageBitmap(file).catch(() => null as ImageBitmap | null);
    const imgEl = bitmap ? null : await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
    const srcW = bitmap ? bitmap.width : (imgEl as HTMLImageElement).naturalWidth;
    const srcH = bitmap ? bitmap.height : (imgEl as HTMLImageElement).naturalHeight;
    const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
    const dstW = Math.max(1, Math.round(srcW * scale));
    const dstH = Math.max(1, Math.round(srcH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = dstW; canvas.height = dstH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    if (bitmap) {
      ctx.drawImage(bitmap, 0, 0, dstW, dstH);
    } else if (imgEl) {
      ctx.drawImage(imgEl, 0, 0, dstW, dstH);
      URL.revokeObjectURL((imgEl as HTMLImageElement).src);
    }
    // Prefer WebP for size; fall back to JPEG if not supported
    const type = 'image/webp';
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b as Blob), type, quality));
    return blob;
  }

  function sanitizeName(name: string): string {
    const base = name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return `${base || 'image'}.webp`;
  }

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
											// Prepare resized, optimized blob and a sanitized name
											const blob = await resizeToWebp(file);
											const path = `${vehicleId}/${Date.now()}_${sanitizeName(file.name)}`;
											const { error: upErr } = await supabase.storage.from('vehicle-media').upload(path, blob, { upsert: true, contentType: blob.type });
										if (upErr) throw new Error(upErr.message);
											success('Uploaded');
											// Persist gallery view on reload
											try { location.hash = '#gallery'; } catch {}
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
						// Force reload and keep gallery visible
						try { location.hash = '#gallery'; } catch {}
						location.reload();
					} catch (e) {
						error(e instanceof Error ? e.message : "Failed to delete");
					}
				}}
			/>
		</>
	);
}


