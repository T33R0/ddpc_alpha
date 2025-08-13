type VehicleIdentity = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  nickname: string | null;
};

type Props = {
  vehicle: VehicleIdentity;
};

// A visually rich spec-sheet inspired block. Data is intentionally fabricated
// and lightly randomized to avoid looking copied from any publication.
export default function VehicleSpecSheet({ vehicle }: Props) {
  const title = vehicle.nickname ?? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  const specs = {
    msrp: "$198,450",
    layout: "mid, longitudinal",
    engine: "twin‑turbo V8 hybrid",
    displacement: "3996 cc",
    power: "724 hp @ 7,800 rpm",
    torque: "612 lb‑ft @ 3,100 rpm",
    redline: "8,200 rpm",
    transmission: "8‑speed dual‑clutch, RWD",
    finalDrive: "3.36:1, e‑diff",
    weight: "3,420 lb",
    weightDist: "41/59",
    tiresFront: "265/35ZR20",
    tiresRear: "325/30ZR21",
    brakesFront: "16.1 in carbon‑ceramic",
    brakesRear: "15.0 in carbon‑ceramic",
    fuel: "93 octane premium",
    cityHwy: "14/21 mpg (est)",
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
    <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 p-6 border-b lg:border-b-0 lg:border-r">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="uppercase tracking-wider text-xs text-gray-500">Specs</div>
              <h2 className="mt-1 text-xl font-semibold">{title || "Vehicle"}</h2>
              <div className="text-sm text-gray-600">Spec sheet inspired overview</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-red-600">{tests.zeroToSixty}</div>
              <div className="text-xs text-gray-600">0–60 mph, seconds</div>
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

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-sm font-semibold mb-2">Acceleration</div>
              <ul className="text-sm divide-y">
                {accelTable.map((row) => (
                  <li key={row.label} className="flex items-center justify-between py-1.5">
                    <span className="text-gray-600">{row.label}</span>
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
            <div className="text-xs text-gray-600">Top speed, mph (manufacturer)</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-3xl font-bold text-slate-900">{tests.skidpad}<span className="text-lg align-top">g</span></div>
            <div className="text-xs text-gray-600">Roadholding, 300‑ft skidpad</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-3xl font-bold text-slate-900">{tests.braking.sixtyToZero}<span className="text-lg align-top"> ft</span></div>
            <div className="text-xs text-gray-600">Braking, 60–0 mph</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm font-semibold mb-2">Notes</div>
            <p className="text-sm text-gray-700">Figures shown are illustrative and not instrument‑tested. This layout is inspired by print spec cards while keeping our own visual language.</p>
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
            <dt className="text-gray-600">{k}</dt>
            <dd className="font-medium text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}


