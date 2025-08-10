-- Add last_event_at column to vehicle and backfill, plus trigger to maintain it
begin;

alter table if exists public.vehicle
  add column if not exists last_event_at timestamp with time zone null;

-- Backfill from existing events
update public.vehicle v
set last_event_at = e.max_created_at
from (
  select vehicle_id, max(created_at) as max_created_at
  from public.event
  group by vehicle_id
) e
where e.vehicle_id = v.id;

-- Helper function to update vehicle.last_event_at on new event insert
create or replace function public.fn_update_vehicle_last_event_at()
returns trigger as $$
begin
  update public.vehicle
  set last_event_at = greatest(coalesce(last_event_at, to_timestamp(0)), new.created_at)
  where id = new.vehicle_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on event insert
create trigger trg_event_after_insert_update_vehicle_last
after insert on public.event
for each row execute function public.fn_update_vehicle_last_event_at();

commit;
