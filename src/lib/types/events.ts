// canonical list used across UI & validators
export const EVENT_TYPE_OPTIONS = [
  "SERVICE",
  "INSTALL",
  "INSPECT",
  "TUNE",
  "MOD",
  "DYNO",
  "NOTE",
  "MERGE",
] as const;

export type TimelineEventType = (typeof EVENT_TYPE_OPTIONS)[number];


