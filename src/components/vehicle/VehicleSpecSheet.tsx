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
    redline: "—",
    transmission: "—",
    finalDrive: "—",
    weight: "—",
    weightDist: "—",
    tiresFront: "—",
    tiresRear: "—",
    brakesFront: "—",
    brakesRear: "—",
    fuel: "—",
    cityHwy: "—",
  } as const;

  const specs = {
    msrp: (db?.base_msrp as string | null) ?? (db?.new_price_range as string | null) ?? fallback.msrp,
    layout: (db?.layout as string | null) ?? (db?.drive_type as string | null) ?? fallback.layout,
    engine: (db?.engine_type as string | null) ?? fallback.engine,
    displacement: (db?.engine_size_l ? `${db?.engine_size_l} L` : null) ?? fallback.displacement,
    power: (db?.horsepower_hp ? `${db?.horsepower_hp} hp` : null) ?? fallback.power,
    torque: (db?.torque_ft_lbs ? `${db?.torque_ft_lbs} lb‑ft` : null) ?? fallback.torque,
    redline: fallback.redline,
    transmission: (db?.transmission as string | null) ?? fallback.transmission,
    finalDrive: fallback.finalDrive,
    weight: (db?.curb_weight_lbs ? `${db?.curb_weight_lbs} lb` : null) ?? fallback.weight,
    weightDist: fallback.weightDist,
    tiresFront: (db?.tires_and_wheels as string | null) ?? fallback.tiresFront,
    tiresRear: fallback.tiresRear,
    brakesFront: (db?.front_brakes as string | null) ?? fallback.brakesFront,
    brakesRear: (db?.rear_brakes as string | null) ?? fallback.brakesRear,
    fuel: (db?.fuel_type as string | null) ?? fallback.fuel,
    cityHwy: (db?.epa_city_highway_mpg as string | null) ?? (db?.epa_city_highway_mpge as string | null) ?? fallback.cityHwy,
  } as const;

  const tests = {
    zeroToSixty: "2.7",
    quarterMile: { time: "10.4", speed: "137" },
    topSpeed: "214",
    skidpad: "1.12",
    braking: { sixtyToZero: "104" },
  } as const;

  const accelTable: Array<{ label: string; value: string }> = [
    { label: "0–30", value: "1.1 s" },
    { label: "0–40", value: "1.6 s" },
    { label: "0–50", value: "2.1 s" },
    { label: "0–60", value: `${tests.zeroToSixty} s` },
    { label: "0–100", value: "5.7 s" },
    { label: "1/4‑mile", value: `${tests.quarterMile.time} s @ ${tests.quarterMile.speed} mph` },
  ];

  return (
    <section className="rounded-2xl border bg-card text-fg shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 p-6 border-b lg:border-b-0 lg:border-r">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="uppercase tracking-wider text-xs text-muted">Specs</div>
              <h2 className="mt-1 text-xl font-semibold">{title || "Vehicle"}</h2>
              <div className="text-sm text-muted">Spec sheet inspired overview</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-red-600">{tests.zeroToSixty}</div>
              <div className="text-xs text-muted">0–60 mph, seconds</div>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <SpecGroup title="Powertrain" items={{
              "Layout": specs.layout,
              "Engine": specs.engine,
              "Displacement": specs.displacement,
              "Peak power": specs.power,
              "Peak torque": specs.torque,
              "Redline": specs.redline,
              "Transmission": specs.transmission,
              "Final drive": specs.finalDrive,
            }} />

            <SpecGroup title="Chassis, brakes & tires" items={{
              "Curb weight": specs.weight,
              "Weight distribution": specs.weightDist,
              "Front brakes": specs.brakesFront,
              "Rear brakes": specs.brakesRear,
              "Front tires": specs.tiresFront,
              "Rear tires": specs.tiresRear,
            }} />

            <SpecGroup title="Dimensions & fuel" items={{
              "MSRP (as tested)": specs.msrp,
              "Fuel": specs.fuel,
              "City/Highway": specs.cityHwy,
            }} />

            <div className="rounded-xl border p-4">
              <div className="text-sm font-semibold mb-2">Acceleration</div>
              <ul className="text-sm divide-y">
                {accelTable.map((row) => (
                  <li key={row.label} className="flex items-center justify-between py-1.5">
                    <span className="text-muted">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-xl border p-4">
            <div className="text-3xl font-bold text-red-600">{tests.topSpeed}</div>
            <div className="text-xs text-muted">Top speed, mph (manufacturer)</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-3xl font-bold">{tests.skidpad}<span className="text-lg align-top">g</span></div>
            <div className="text-xs text-muted">Roadholding, 300‑ft skidpad</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-3xl font-bold">{tests.braking.sixtyToZero}<span className="text-lg align-top"> ft</span></div>
            <div className="text-xs text-muted">Braking, 60–0 mph</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm font-semibold mb-2">Notes</div>
            <p className="text-sm text-muted">Figures shown are illustrative and not instrument‑tested. This layout is inspired by print spec cards while keeping our own visual language.</p>
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


