export type QuickAddEventType = "SERVICE" | "INSTALL" | "INSPECT" | "TUNE";

// Simple, swappable mapping for quick-add default event type.
// For now, always returns "SERVICE"; adjust as Windsurf finalizes contracts.
export function eventTypeForQuickAdd(_title: string): QuickAddEventType {
  return "SERVICE";
}


