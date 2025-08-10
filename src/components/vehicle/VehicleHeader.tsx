import Link from "next/link";
import Image from "next/image";
import PrivacyBadge from "@/components/PrivacyBadge";

type Props = {
  vehicle: { id: string; nickname: string | null; year: number | null; make: string | null; model: string | null; privacy: string | null };
  coverUrl?: string | null;
  backHref?: string | null;
};

export default function VehicleHeader({ vehicle, coverUrl, backHref = "/vehicles" }: Props) {
  const title = vehicle.nickname ?? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim();
  const meta = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <PrivacyBadge value={vehicle.privacy} />
        </div>
        {backHref ? (
          <div className="flex items-center gap-3 text-sm">
            <Link href={backHref} className="text-blue-600 hover:underline">Back</Link>
          </div>
        ) : null}
      </div>
      <div className="text-sm text-gray-600 flex items-center gap-2">
        <span>{meta}</span>
      </div>
      <div className="text-sm text-gray-700" data-test="vehicle-helper-copy">
        <strong>Tasks</strong> = planned work. <strong>Timeline</strong> = what actually happened.
      </div>
      <div className="rounded-2xl overflow-hidden border bg-white">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${vehicle.year ?? ''} ${vehicle.make ?? ''} ${vehicle.model ?? ''} (${vehicle.nickname ?? 'Vehicle'})`}
            width={1280}
            height={720}
            className="w-full h-auto max-h-[420px] object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-gray-400">No photo</div>
        )}
      </div>
    </div>
  );
}


