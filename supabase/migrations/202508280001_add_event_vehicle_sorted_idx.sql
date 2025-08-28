-- Improve timeline query performance by supporting filter + order
-- This index matches WHERE vehicle_id = ? ORDER BY occurred_at DESC, created_at DESC
-- Safe to run multiple times
CREATE INDEX IF NOT EXISTS idx_event_vehicle_occur_created
  ON public.event (vehicle_id, occurred_at DESC, created_at DESC);


