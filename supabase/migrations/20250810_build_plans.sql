-- Build plans (branches)
create table if not exists public.build_plans (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','active','archived','merged')),
  is_default boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add optional plan to tasks (work_items)
alter table public.work_item
  add column if not exists build_plan_id uuid references public.build_plans(id) on delete set null;

-- index helpers
create index if not exists build_plans_vehicle_status_idx on public.build_plans (vehicle_id, status);
create index if not exists work_items_build_plan_idx on public.work_item (build_plan_id);

-- RLS
alter table public.build_plans enable row level security;

-- Owners/garage-members can read their vehicle’s plans; public has no access for MVP
create policy if not exists "bp_read_owner_members"
on public.build_plans for select
using (
  exists (
    select 1 from public.vehicles v
    where v.id = build_plans.vehicle_id
      and (
        v.owner_id = auth.uid()
        or exists (
          select 1 from public.garage_members gm
          where gm.garage_id = v.garage_id
            and gm.user_id = auth.uid()
        )
      )
  )
);

create policy if not exists "bp_write_owner_only"
on public.build_plans for all
using (
  exists (
    select 1 from public.vehicles v
    where v.id = build_plans.vehicle_id and v.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.vehicles v
    where v.id = build_plans.vehicle_id and v.owner_id = auth.uid()
  )
);

-- Optional: keep is_default unique per vehicle
create unique index if not exists build_plans_vehicle_default_unique
  on public.build_plans (vehicle_id) where is_default = true;
