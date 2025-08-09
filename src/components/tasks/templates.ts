export type TaskTemplate = {
  id: string;
  scope: "GLOBAL" | "GARAGE";
  garage_id?: string | null;
  title: string;
  default_tags?: string[] | null;
  suggested_due_interval_days?: number | null;
};

// Static GLOBAL templates seed. Replace with DB-backed list later.
export const GLOBAL_TEMPLATES: TaskTemplate[] = [
  {
    id: "tmpl-oil-change",
    scope: "GLOBAL",
    title: "Oil change",
    default_tags: ["maintenance", "oil"],
    suggested_due_interval_days: 180, // ~6 months
  },
  {
    id: "tmpl-tire-rotation",
    scope: "GLOBAL",
    title: "Tire rotation",
    default_tags: ["tires"],
    suggested_due_interval_days: 180,
  },
  {
    id: "tmpl-brake-pads-inspect",
    scope: "GLOBAL",
    title: "Inspect brake pads",
    default_tags: ["brakes"],
    suggested_due_interval_days: 180,
  },
  {
    id: "tmpl-air-filter",
    scope: "GLOBAL",
    title: "Replace engine air filter",
    default_tags: ["filters"],
    suggested_due_interval_days: 365,
  },
  {
    id: "tmpl-cabin-filter",
    scope: "GLOBAL",
    title: "Replace cabin air filter",
    default_tags: ["filters", "interior"],
    suggested_due_interval_days: 365,
  },
];
