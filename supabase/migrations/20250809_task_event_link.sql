-- Link events to originating task (one-way)
alter table if exists public.event
  add column if not exists task_id uuid null references public.work_item(id) on delete set null;


