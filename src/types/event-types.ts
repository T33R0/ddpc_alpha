export type EventTypeCategory =
  | 'ownership' | 'location' | 'status' | 'legal'
  | 'recognition' | 'incident' | 'milestone' | 'customization';

export interface EventType {
  id: string;
  key: string;
  label: string;
  category: EventTypeCategory;
  icon: string;  // lucide icon name
  color: string; // tailwind hue root, e.g. 'amber'
  sort_order: number;
  is_active: boolean;
}


