export type BuyerSnapshot = {
  vehicle_id: string;
  year: number | null; make: string; model: string; trim: string | null;
  vin: string | null; nickname: string | null;
  owner_count: number; title_status: string | null;
  last_activity_on: string | null;
  last_service_odo: number | null; last_service_on: string | null;
  last_known_odo: number | null; notable_mods: string | null;
};

export type Inspection = {
  id: string; vehicle_id: string; kind: 'ppi'|'emissions'|'general';
  inspected_on: string; odo?: number | null; result?: string | null;
  report_media_id?: string | null; created_by: string; created_at: string;
};

export type Repair = {
  id: string; vehicle_id: string; occurred_on: string; odo?: number | null;
  description: string; shop?: string | null; insurance_claim?: boolean | null;
  cost?: number | null; photos?: unknown[] | null; created_by: string; created_at: string;
};

export type DynoRun = {
  id: string; vehicle_id: string; run_on: string; odo?: number | null;
  tune_label?: string | null; whp?: number | null; wtq?: number | null;
  boost_psi?: number | null; afr_note?: string | null; sheet_media_id?: string | null;
  created_by: string; created_at: string;
};

export type UsageLog = {
  id: string; vehicle_id: string; occurred_on: string; odo?: number | null;
  kind: 'daily'|'weekend'|'track_day'|'road_trip'|'show'|'storage';
  details?: string | null; created_by: string; created_at: string;
};

export type ModEntry = {
  part_state_id: string; vehicle_id: string; slot_code: string | null;
  slot_label: string | null; installed_on: string | null; removed_on: string | null;
  notes: string | null; brand: string | null; part_name: string | null;
  part_number: string | null; specs: Record<string, any> | null;
  created_by: string | null; created_at: string;
};
