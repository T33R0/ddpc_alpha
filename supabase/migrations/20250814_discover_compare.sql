-- Discover / Compare / Image cache schema + RLS
--
-- Vehicles source (reference only). If already present, DO NOT recreate; just document fields used by discover.
-- Expect at least: id (uuid or bigint), year int, make text, model text, trim text, body_style text,
-- cylinders int, induction text, drivetrain text, doors int, transmission text, fuel_type text,
-- displacement_l numeric, power_hp int, torque_lbft int.
--
-- NOTE: This project already uses public.vehicles (uuid primary key). We will align references to uuid.

-- 1) Vehicle Images cache
create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  source_url text,
  storage_path text,                -- Supabase storage path (e.g. 'discover-images/<vehicle_id>.jpg')
  width int,
  height int,
  hash text,                        -- perceptual hash or sha1 of bytes
  status text not null default 'ready',  -- 'ready' | 'pending' | 'failed'
  fail_count int not null default 0,
  last_checked_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vi_vehicle_id_idx on public.vehicle_images(vehicle_id);
create index if not exists vi_status_idx on public.vehicle_images(status);

-- 2) Discover Saved Filters (optional, for signed-in users)
create table if not exists public.discover_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  query jsonb not null,             -- structured filter payload
  created_at timestamptz not null default now()
);
create index if not exists df_user_idx on public.discover_filters(user_id);

-- 3) Comparison sets
create table if not exists public.vehicle_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_ids uuid[] not null,      -- up to 4
  title text,
  created_at timestamptz not null default now()
);
create index if not exists vc_user_idx on public.vehicle_comparisons(user_id);

-- Trigger to auto-update updated_at on vehicle_images
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_vi_touch on public.vehicle_images;
create trigger trg_vi_touch before update on public.vehicle_images
  for each row execute function public.touch_updated_at();

-- RLS (owner‑only)
alter table public.vehicle_images enable row level security;
alter table public.discover_filters enable row level security;
alter table public.vehicle_comparisons enable row level security;

-- Images are public read (used across users), but only service roles can write.
drop policy if exists vi_select on public.vehicle_images;
create policy vi_select on public.vehicle_images for select
  using (true);

drop policy if exists vi_write on public.vehicle_images;
create policy vi_write on public.vehicle_images for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Filters (user-scoped)
drop policy if exists df_rw on public.discover_filters;
create policy df_rw on public.discover_filters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Comparisons (user-scoped)
drop policy if exists vc_rw on public.vehicle_comparisons;
create policy vc_rw on public.vehicle_comparisons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


