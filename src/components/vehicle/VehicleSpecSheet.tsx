type VehicleIdentity = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  nickname: string | null;
};

type Props = {
  vehicle: VehicleIdentity;
  specs?: Record<string, string | number | null>;
};

// A visually rich spec-sheet inspired block. Data is intentionally fabricated
// and lightly randomized to avoid looking copied from any publication.
export default function VehicleSpecSheet({ vehicle, specs: db }: Props) {
  const title = vehicle.nickname ?? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  const fallback = {
    msrp: "$—",
    layout: "—",
    engine: "—",
    displacement: "—",
    power: "—",
    torque: "—",
    transmission: "—",
    finalDrive: "—",
    weight: "—",
    weightDist: "—",
    tires: "—",
    brakesFront: "—",
    brakesRear: "—",
    fuel: "—",
    cityHwy: "—",
  } as const;

  const asNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const fmt = (v: unknown, unit: string, digits = 1): string | null => {
    const n = asNum(v);
    if (n === null) return null;
    const isInt = Number.isInteger(n) && digits === 0;
    const val = n.toLocaleString(undefined, {
      minimumFractionDigits: isInt ? 0 : digits,
      maximumFractionDigits: isInt ? 0 : digits,
    });
    return `${val} ${unit}`;
  };

  const specs = {
    msrp: (db?.base_msrp as string | null) ?? (db?.new_price_range as string | null) ?? fallback.msrp,
    layout: (db?.layout as string | null) ?? (db?.drive_type as string | null) ?? fallback.layout,
    engine:
      (db?.engine_type as string | null) ??
      ((db?.cylinders ? `${db?.cylinders} cyl` : null) as string | null) ??
      fallback.engine,
    displacement: fmt(db?.engine_size_l, "L", 1) ?? fallback.displacement,
    power:
      (db?.horsepower_hp ? `${asNum(db?.horsepower_hp)?.toLocaleString()} hp` : null) ??
      fallback.power,
    torque:
      (db?.torque_ft_lbs ? `${asNum(db?.torque_ft_lbs)?.toLocaleString()} lb‑ft` : null) ??
      fallback.torque,
    transmission: (db?.transmission as string | null) ?? fallback.transmission,
    finalDrive: fallback.finalDrive,
    weight: (db?.curb_weight_lbs ? `${asNum(db?.curb_weight_lbs)?.toLocaleString()} lb` : null) ?? fallback.weight,
    weightDist: fallback.weightDist,
    tires: (db?.tires_and_wheels as string | null) ?? fallback.tires,
    brakesFront: (db as any)?.front_brakes ?? fallback.brakesFront,
    brakesRear: (db as any)?.rear_brakes ?? fallback.brakesRear,
    fuel: (db?.fuel_type as string | null) ?? fallback.fuel,
    cityHwy: (db?.epa_city_highway_mpg as string | null) ?? (db?.epa_city_highway_mpge as string | null) ?? fallback.cityHwy,
    length: fmt(db?.length_in, "in", 1) ?? "—",
    width: fmt(db?.width_in, "in", 1) ?? "—",
    height: fmt(db?.height_in, "in", 1) ?? "—",
    wheelbase: fmt(db?.wheelbase_in, "in", 1) ?? "—",
    groundClearance: fmt(db?.ground_clearance_in, "in", 1) ?? "—",
    turningCircle: fmt(db?.turning_circle_ft, "ft", 1) ?? "—",
    fuelTank: fmt(db?.fuel_tank_capacity_gal, "gal", 1) ?? "—",
    cargo: fmt(db?.cargo_capacity_cu_ft, "cu ft", 1) ?? "—",
    cargoMax: fmt(db?.maximum_cargo_capacity_cu_ft, "cu ft", 1) ?? "—",
  } as const;

  return (
    <section className="rounded-2xl border bg-card text-fg shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-3 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="uppercase tracking-wider text-xs text-muted">Specs</div>
              <h2 className="mt-1 text-xl font-semibold">{title || "Vehicle"}</h2>
              <div className="text-sm text-muted">Spec sheet inspired overview</div>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <SpecGroup title="Powertrain" items={{
              "Layout": specs.layout,
              "Engine": specs.engine,
              "Displacement": specs.displacement,
              "Peak power": specs.power,
              "Peak torque": specs.torque,
              "Transmission": specs.transmission,
              "Final drive": specs.finalDrive,
            }} />

            <SpecGroup title="Chassis, brakes & tires" items={{
              "Curb weight": specs.weight,
              "Weight distribution": specs.weightDist,
              "Front brakes": specs.brakesFront,
              "Rear brakes": specs.brakesRear,
              "Front tires": specs.tires,
              "Rear tires": specs.tires,
            }} />

            <SpecGroup title="Dimensions & fuel" items={{
              "MSRP (as tested)": specs.msrp,
              "Fuel": specs.fuel,
              "City/Highway": specs.cityHwy,
              "Length": specs.length,
              "Width": specs.width,
              "Height": specs.height,
              "Wheelbase": specs.wheelbase,
              "Ground clearance": specs.groundClearance,
              "Turning circle": specs.turningCircle,
              "Fuel tank": specs.fuelTank,
              "Cargo capacity": specs.cargo,
              "Max cargo capacity": specs.cargoMax,
            }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecGroup({ title, items }: { title: string; items: Record<string, string> }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <dl className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {Object.entries(items).map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}


