import { getServerSupabase } from "@/lib/supabase";
import MediaSection from "../media-section";

export const dynamic = "force-dynamic";

export default async function VehicleMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = await params;
  const supabase = await getServerSupabase();

  let mediaItems: { id: string; src: string; fullSrc: string; alt?: string }[] = [];
  try {
    const prefix = `${vehicleId}/`;
    const { data: list } = await supabase.storage.from("vehicle-media").list(prefix, { limit: 500 });
    const files = (list ?? []) as Array<{ name: string }>;
    mediaItems = files
      .filter(f => /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(f.name))
      .map(f => {
        const path = `${prefix}${f.name}`;
        const { data } = supabase.storage.from("vehicle-media").getPublicUrl(path);
        const url = data.publicUrl;
        return { id: path, src: url, fullSrc: url, alt: f.name };
      });
  } catch {}

  return (
    <div className="space-y-4">
      <MediaSection media={mediaItems} vehicleId={vehicleId} />
    </div>
  );
}


