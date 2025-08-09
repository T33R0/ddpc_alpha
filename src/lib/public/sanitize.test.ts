import assert from "node:assert";
import { sanitizeVehicleForPublic } from "./sanitize";

// Lightweight unit check without a test runner, compiled only.
function run() {
  const vehicle: {
    id: string;
    vin: string | null;
    year: number | null;
    make: string;
    model: string;
    trim: string | null;
    nickname: string | null;
    privacy: "PUBLIC" | "PRIVATE";
    photo_url: string | null;
    garage_id?: string;
  } = {
    id: "v1",
    vin: "SECRETVIN",
    year: 2020,
    make: "Subaru",
    model: "WRX",
    trim: "STI",
    nickname: "Blue",
    privacy: "PUBLIC",
    photo_url: "https://example.com/p.jpg",
    garage_id: "g1",
  };

  const events: Array<{
    id: string;
    notes: string | null;
    created_at: string;
    type: string;
    cost?: number;
    odometer?: number;
  }> = [
    { id: "e1", notes: "Oil change", created_at: "2024-01-01T00:00:00Z", type: "SERVICE", cost: 50, odometer: 10000 },
    { id: "e2", notes: "Tires", created_at: "2024-02-01T00:00:00Z", type: "INSTALL", cost: 600, odometer: 11000 },
  ];

  const safe = sanitizeVehicleForPublic(vehicle, events);
  assert.strictEqual(safe.display_name, "Blue");
  assert.strictEqual(safe.make, "Subaru");
  assert.strictEqual(safe.model, "WRX");
  assert.strictEqual(safe.photo_url, "https://example.com/p.jpg");
  // Forbidden outputs
  assert.ok(!(safe as unknown as { vin?: string }).vin);
  assert.ok(!(safe as unknown as { garage_id?: string }).garage_id);
  // Events sanitized
  assert.deepStrictEqual(safe.events[0], { title: "Oil change", occurred_at: "2024-01-01T00:00:00Z", type: "SERVICE" });
  // No odometer/cost/docs in events
  assert.ok(!((safe.events[0] as unknown as { odometer?: number }).odometer));
  assert.ok(!((safe.events[0] as unknown as { cost?: number }).cost));
}

run();


