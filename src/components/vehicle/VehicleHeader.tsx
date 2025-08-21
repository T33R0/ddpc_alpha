"use client";
import Link from "next/link";
import Image from "next/image";
import PrivacyBadge from "@/components/PrivacyBadge";
import { useCallback, useState } from "react";
import { Warehouse } from "lucide-react";

type Props = {
  vehicle: { id: string; nickname: string | null; year: number | null; make: string | null; model: string | null; privacy: string | null };
  coverUrl?: string | null;
  backHref?: string | null;
  showPublicLink?: boolean;
};

export default function VehicleHeader({ vehicle, coverUrl, backHref = "/vehicles" }: Props) {
  const title = vehicle.nickname ?? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim();
  const meta = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(coverUrl ?? null);
  const [didRetry, setDidRetry] = useState(false);

  const handleError = useCallback(async () => {
    if (!vehicle.id || didRetry) return;
    setDidRetry(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/cover-url`, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      if (typeof json?.url === "string" && json.url) {
        setImgLoaded(false);
        setCurrentSrc(json.url);
      }
    } catch {}
  }, [vehicle.id, didRetry]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <PrivacyBadge value={vehicle.privacy} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {backHref ? (
            <Link href={backHref} aria-label="Garage" title="Garage" className="inline-flex items-center justify-center w-8 h-8 rounded-full border bg-card text-fg hover:bg-bg/60" data-testid="back-to-vehicles">
              <Warehouse className="w-5 h-5" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className="text-sm text-gray-600 flex items-center gap-2">
        <span>{meta}</span>
      </div>
      
      <div className="relative rounded-2xl overflow-hidden border bg-card" data-testid="vehicle-cover">
        {currentSrc ? (
          <>
            {!imgLoaded && (
              <div
                className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(255,255,255,0.08),45%,rgba(255,255,255,0.16),55%,rgba(255,255,255,0.08))] bg-[length:200%_100%]"
                aria-hidden
                data-testid="vehicle-cover--loading"
              />
            )}
            <Image
              src={currentSrc}
              alt={`${vehicle.year ?? ''} ${vehicle.make ?? ''} ${vehicle.model ?? ''} (${vehicle.nickname ?? 'Vehicle'})`}
              width={1280}
              height={720}
              placeholder="empty"
              onLoad={() => setImgLoaded(true)}
              onError={handleError}
              className={`w-full h-auto max-h-[420px] object-cover ${imgLoaded ? '' : 'opacity-0'}`}
              data-testid="vehicle-cover-img"
            />
          </>
        ) : (
          <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-gray-400" data-testid="vehicle-cover--placeholder">No photo</div>
        )}
        {/* Prev/Next arrows (present even when there is no photo) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
          <a href="#" className="pointer-events-auto inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/60" data-testid="veh-prev" title="Previous vehicle">‹</a>
          <a href="#" className="pointer-events-auto inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/60" data-testid="veh-next" title="Next vehicle">›</a>
        </div>
      </div>
    </div>
  );
}


