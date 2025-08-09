-- Alpha schema v0 (Supabase Postgres)
-- Run in Supabase SQL editor. Adjust schemas/policies as needed.

create table if not exists garage (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('PERSONAL','SHOP','CLUB')) default 'PERSONAL',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists garage_member (
  garage_id uuid references garage(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('OWNER','MEMBER')) not null default 'MEMBER',
  created_at timestamptz not null default now(),
  primary key (garage_id, user_id)
);

create table if not exists vehicle (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garage(id) on delete cascade,
  vin text,
  year int,
  make text not null,
  model text not null,
  trim text,
  nickname text,
  privacy text check (privacy in ('PUBLIC','PRIVATE')) not null default 'PRIVATE',
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists work_item (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicle(id) on delete cascade,
  status text check (status in ('BACKLOG','PLANNED','IN_PROGRESS','DONE')) not null default 'BACKLOG',
  title text not null,
  due date,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists event (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicle(id) on delete cascade,
  type text check (type in ('SERVICE','INSTALL','INSPECT','TUNE')) not null,
  odometer int,
  notes text,
  cost numeric(10,2),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  url text not null,
  kind text check (kind in ('photo','doc')) not null default 'photo',
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  user_id uuid references auth.users(id),
  diff jsonb not null,
  created_at timestamptz not null default now()
);

-- Basic RLS
alter table garage enable row level security;
alter table garage_member enable row level security;
alter table vehicle enable row level security;
alter table work_item enable row level security;
alter table event enable row level security;

-- Policies (simplified):
-- A user can see garages they own or are a member of
drop policy if exists garage_select on garage;
create policy garage_select on garage
for select using (
  owner_id = auth.uid() or id in (
    select garage_id from garage_member gm where gm.user_id = auth.uid()
  )
);

-- Owner can insert garages
drop policy if exists garage_insert on garage;
create policy garage_insert on garage
for insert with check (owner_id = auth.uid());

-- Members table: user can see their memberships
drop policy if exists gm_select on garage_member;
create policy gm_select on garage_member
for select using (
  -- Avoid referencing garage here to prevent recursive RLS lookups
  user_id = auth.uid()
);

drop policy if exists gm_insert on garage_member;
create policy gm_insert on garage_member
for insert with check (exists (
  select 1 from garage g where g.id = garage_id and g.owner_id = auth.uid()
));

-- Vehicles: visible to members of the garage or public
drop policy if exists vehicle_select on vehicle;
create policy vehicle_select on vehicle
for select using (
  privacy = 'PUBLIC' or garage_id in (
    select garage_id from garage_member gm where gm.user_id = auth.uid()
  ) or exists (
    select 1 from garage g where g.id = vehicle.garage_id and g.owner_id = auth.uid()
  )
);

drop policy if exists vehicle_crud on vehicle;
create policy vehicle_crud on vehicle
for all using (
  garage_id in (select garage_id from garage_member where user_id = auth.uid())
  or exists (select 1 from garage g where g.id = vehicle.garage_id and g.owner_id = auth.uid())
) with check (
  garage_id in (select garage_id from garage_member where user_id = auth.uid())
  or exists (select 1 from garage g where g.id = vehicle.garage_id and g.owner_id = auth.uid())
);

-- Work items/events follow vehicle access
drop policy if exists work_item_crud on work_item;
create policy work_item_crud on work_item for all using (
  vehicle_id in (select id from vehicle v where
    v.garage_id in (select garage_id from garage_member where user_id = auth.uid())
    or exists (select 1 from garage g where g.id = v.garage_id and g.owner_id = auth.uid())
  )
) with check (true);

drop policy if exists event_crud on event;
create policy event_crud on event for all using (
  vehicle_id in (select id from vehicle v where
    v.garage_id in (select garage_id from garage_member where user_id = auth.uid())
    or exists (select 1 from garage g where g.id = v.garage_id and g.owner_id = auth.uid())
  )
) with check (true);

-- Public can read events for PUBLIC vehicles (sanitized projection is enforced in the app; policy allows row access)
drop policy if exists event_public_select on event;
create policy event_public_select on event
for select using (
  exists (
    select 1 from vehicle v where v.id = event.vehicle_id and v.privacy = 'PUBLIC'
  )
);

-- Storage policies for uploads to public bucket 'vehicle-media'
-- Note: Buckets are managed in the Storage UI; these policies grant authenticated users rights to upload/manage their own files.
-- storage schema is managed by Supabase; RLS is enabled on storage.objects by default.
drop policy if exists vehicle_media_select on storage.objects;
create policy vehicle_media_select on storage.objects
for select using (
  bucket_id = 'vehicle-media'
);

drop policy if exists vehicle_media_insert on storage.objects;
create policy vehicle_media_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'vehicle-media'
);

drop policy if exists vehicle_media_update on storage.objects;
create policy vehicle_media_update on storage.objects
for update to authenticated using (
  bucket_id = 'vehicle-media' and owner = auth.uid()
) with check (
  bucket_id = 'vehicle-media' and owner = auth.uid()
);

drop policy if exists vehicle_media_delete on storage.objects;
create policy vehicle_media_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'vehicle-media' and owner = auth.uid()
);
