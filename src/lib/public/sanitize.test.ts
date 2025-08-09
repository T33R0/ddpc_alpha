import assert from "node:assert";
import { sanitizeVehicleForPublic } from "./sanitize";

// Lightweight unit check without a test runner, compiled only.
function run() {
  const vehicle = {
    id: "v1",
    vin: "SECRETVIN",
    year: 2020,
    make: "Subaru",
    model: "WRX",
    trim: "STI",
    nickname: "Blue",
    privacy: "PUBLIC" as const,
    photo_url: "https://example.com/p.jpg",
    garage_id: "g1",
    cost: 123,
  } as any;

  const events = [
    { id: "e1", notes: "Oil change", created_at: "2024-01-01T00:00:00Z", type: "SERVICE", cost: 50, odometer: 10000 },
    { id: "e2", notes: "Tires", created_at: "2024-02-01T00:00:00Z", type: "INSTALL", cost: 600, odometer: 11000 },
  ] as any;

  const safe = sanitizeVehicleForPublic(vehicle, events);
  assert.strictEqual(safe.display_name, "Blue");
  assert.strictEqual(safe.make, "Subaru");
  assert.strictEqual(safe.model, "WRX");
  assert.strictEqual(safe.photo_url, "https://example.com/p.jpg");
  assert.ok(!(safe as any).vin);
  assert.ok(!(safe as any).garage_id);
  assert.deepStrictEqual(safe.events[0], { title: "Oil change", occurred_at: "2024-01-01T00:00:00Z", type: "SERVICE" });
  assert.ok(!(safe.events[0] as any).odometer);
  assert.ok(!(safe.events[0] as any).cost);
}

run();


