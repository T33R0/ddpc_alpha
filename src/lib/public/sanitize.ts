export type PublicEvent = {
  title: string;
  occurred_at: string;
  type?: string;
};

export type PublicVehicle = {
  display_name: string;
  year: number | null;
  make: string;
  model: string;
  trim: string | null;
  photo_url: string | null;
  privacy: "PUBLIC" | "PRIVATE";
  events: PublicEvent[];
};

type VehicleInput = {
  id: string;
  vin: string | null;
  year: number | null;
  make: string;
  model: string;
  trim: string | null;
  nickname: string | null;
  privacy: "PUBLIC" | "PRIVATE";
  photo_url: string | null;
};

type EventInput = {
  id: string;
  notes: string | null;
  created_at: string;
  type?: string;
  odometer?: number | null;
  cost?: number | null;
  documents?: unknown;
};

export function sanitizeVehicleForPublic(vehicle: VehicleInput, events: EventInput[]): PublicVehicle {
  const displayName = vehicle.nickname?.trim()
    ? vehicle.nickname.trim()
    : [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  const safeEvents: PublicEvent[] = (events ?? [])
    .slice(0, 5)
    .map((e) => ({
      title: e.notes ?? "",
      occurred_at: e.created_at,
      type: e.type,
    }));

  return {
    display_name: displayName,
    year: vehicle.year ?? null,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim ?? null,
    photo_url: vehicle.photo_url ?? null,
    privacy: vehicle.privacy,
    events: safeEvents,
  };
}


