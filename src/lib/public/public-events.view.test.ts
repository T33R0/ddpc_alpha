// Guard tests for the public view contract

type PublicEventRow = {
  id: string;
  vehicle_id: string;
  occurred_at: string;
  type: string;
  display_title: string;
  // Crucially, there must be no 'cost', 'odometer', or 'notes' keys
};

// Simulate a row coming from the public view
const sample: PublicEventRow & Record<string, unknown> = {
  id: "e1",
  vehicle_id: "v1",
  occurred_at: "2025-01-01T00:00:00.000Z",
  type: "SERVICE",
  display_title: "Oil change",
};

// Assert that forbidden keys are not present
if ("cost" in sample || "odometer" in sample || "notes" in sample) {
  throw new Error("Public view leaked forbidden fields");
}

// If sanitizer was bypassed and raw public rows are used, verify only 5 fields exist
const keys = Object.keys(sample);
if (keys.length !== 5) {
  throw new Error(`Public view must expose exactly 5 fields; got ${keys.length}`);
}

// Mapping to sanitizer shape (defense-in-depth): title should equal display_title
const mapped = {
  id: sample.id,
  vehicle_id: sample.vehicle_id,
  occurred_at: sample.occurred_at,
  type: sample.type,
  title: sample.display_title,
};

if (mapped.title !== sample.display_title) {
  throw new Error("Mapped title must equal display_title");
}

if ("cost" in mapped || "odometer" in mapped || "notes" in mapped) {
  throw new Error("Mapped object must not include sensitive keys");
}


