-- Build Plans: enforce one plan per vehicle and auto-create

-- Safety: system user config table (optional). Harmless if unused.
create table if not exists public.app_settings (
  system_user_id uuid
);

-- A1) Choose a creator: prefer garage owner, else system user
create or replace function public.plan_creator_for_vehicle(p_vehicle uuid)
returns uuid
language sql
stable
as $$
  select coalesce(g.owner_id, (select system_user_id from public.app_settings limit 1))
  from public.vehicle v
  join public.garage g on g.id = v.garage_id
  where v.id = p_vehicle
$$;

-- A1) Create a plan per vehicle if missing
insert into public.build_plans (vehicle_id, name, description, status, is_default, created_by)
select v.id,
       coalesce(nullif(v.nickname,''), v.make || ' ' || v.model),
       'Auto-created plan',
       'open', true,
       public.plan_creator_for_vehicle(v.id)
from public.vehicle v
left join public.build_plans bp on bp.vehicle_id = v.id
where bp.id is null;

-- A1) If any vehicles had >1 plan, keep the newest/default and drop extras
with dups as (
  select vehicle_id, array_agg(id order by is_default desc, created_at desc) ids, count(*) c
  from public.build_plans
  group by vehicle_id
  having count(*) > 1
)
delete from public.build_plans bp
using dups
where bp.vehicle_id = dups.vehicle_id
  and bp.id <> dups.ids[1];

-- A1) Enforce 1:1 going forward
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uq_build_plans_vehicle'
  ) then
    alter table public.build_plans
      add constraint uq_build_plans_vehicle unique (vehicle_id);
  end if;
end$$;

-- A2) Auto-create a plan when a vehicle is created
create or replace function public.ensure_plan_for_vehicle()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from public.build_plans where vehicle_id = new.id) then
    insert into public.build_plans (vehicle_id, name, status, is_default, created_by)
    values (
      new.id,
      coalesce(nullif(new.nickname,''), new.make || ' ' || new.model),
      'open', true,
      (select public.plan_creator_for_vehicle(new.id))
    );
  end if;
  return new;
end
$$;

drop trigger if exists trg_vehicle_autoplan on public.vehicle;
create trigger trg_vehicle_autoplan
after insert on public.vehicle
for each row execute function public.ensure_plan_for_vehicle();


