"use client";
import Link from "next/link";
import Image from "next/image";
import PrivacyBadge from "@/components/PrivacyBadge";
import { useState } from "react";

type Props = {
  vehicle: { id: string; nickname: string | null; year: number | null; make: string | null; model: string | null; privacy: string | null };
  coverUrl?: string | null;
  backHref?: string | null;
};

export default function VehicleHeader({ vehicle, coverUrl, backHref = "/vehicles" }: Props) {
  const title = vehicle.nickname ?? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim();
  const meta = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <PrivacyBadge value={vehicle.privacy} />
        </div>
        {backHref ? (
          <div className="flex items-center gap-3 text-sm">
            <Link href={backHref} className="text-gray-600 hover:underline">Back to vehicles</Link>
          </div>
        ) : null}
      </div>
      <div className="text-sm text-gray-600 flex items-center gap-2">
        <span>{meta}</span>
      </div>
      <div className="text-sm text-gray-700" data-test="vehicle-helper-copy">
        <strong>Tasks</strong> = planned work. <strong>Timeline</strong> = what actually happened.
      </div>
      <div className="relative rounded-2xl overflow-hidden border bg-white">
        {coverUrl ? (
          <>
            {!imgLoaded && (
              <div
                className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,#f4f4f5,45%,#e5e7eb,55%,#f4f4f5)] bg-[length:200%_100%]"
                aria-hidden
              />
            )}
            <Image
              src={coverUrl}
              alt={`${vehicle.year ?? ''} ${vehicle.make ?? ''} ${vehicle.model ?? ''} (${vehicle.nickname ?? 'Vehicle'})`}
              width={1280}
              height={720}
              placeholder="empty"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-auto max-h-[420px] object-cover ${imgLoaded ? '' : 'opacity-0'}`}
              data-test="vehicle-cover-img"
            />
          </>
        ) : (
          <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-gray-400" data-test="vehicle-cover-placeholder">No photo</div>
        )}
      </div>
    </div>
  );
}


