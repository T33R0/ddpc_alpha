import Link from "next/link";
import PrivacyBadge from "@/components/PrivacyBadge";

type Props = {
  vehicle: { id: string; nickname: string | null; year: number | null; make: string | null; model: string | null; privacy: string | null };
};

export default function VehicleHeader({ vehicle }: Props) {
  const title = vehicle.nickname ?? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim();
  const meta = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <PrivacyBadge value={vehicle.privacy} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/vehicles" className="text-blue-600 hover:underline">Back to vehicles</Link>
        </div>
      </div>
      <div className="text-sm text-gray-600 flex items-center gap-2">
        <span>{meta}</span>
      </div>
      <div className="text-sm text-gray-700" data-test="vehicle-helper-copy">
        <strong>Tasks</strong> = planned work. <strong>Timeline</strong> = what actually happened.
      </div>
    </div>
  );
}


