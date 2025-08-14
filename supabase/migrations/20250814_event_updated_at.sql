-- Add updated_at to event and trigger to touch on update
alter table public.event
  add column if not exists updated_at timestamptz not null default now();

-- Reuse touch_updated_at if present; otherwise create
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_event_touch on public.event;
create trigger trg_event_touch before update on public.event
  for each row execute function public.touch_updated_at();


