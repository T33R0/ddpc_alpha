-- Create wishlist tables used by the app
-- Safe to run multiple times with IF NOT EXISTS guards where possible

-- Extension for uuid generation if not present
create extension if not exists "pgcrypto";

-- wishlist_item table
create table if not exists public.wishlist_item (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicle(id) on delete cascade,
  url text,
  vendor_id uuid null references public.vendor(id) on delete set null,
  status text not null default 'PENDING', -- PENDING | APPROVED | PURCHASED
  priority int null, -- 1..5
  est_unit_price numeric null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_wishlist_item_updated on public.wishlist_item;
create trigger trg_wishlist_item_updated
before update on public.wishlist_item
for each row execute procedure public.set_updated_at();

-- wishlist_item_resource (optional links/files for a wishlist item)
create table if not exists public.wishlist_item_resource (
  id uuid primary key default gen_random_uuid(),
  wishlist_item_id uuid not null references public.wishlist_item(id) on delete cascade,
  url text,
  kind text, -- e.g., 'PHOTO' | 'DOC' | 'LINK'
  created_at timestamptz not null default now()
);

-- Enable RLS and add permissive policies for authenticated users (adjust later)
alter table public.wishlist_item enable row level security;
alter table public.wishlist_item_resource enable row level security;

-- Basic policies allowing authenticated users to manage wishlist items for vehicles they can see.
-- NOTE: For alpha, we allow all authenticated users. You should tighten these later to your garage/vehicle membership model.
create policy if not exists wishlist_item_select on public.wishlist_item
  for select to authenticated using (true);
create policy if not exists wishlist_item_insert on public.wishlist_item
  for insert to authenticated with check (true);
create policy if not exists wishlist_item_update on public.wishlist_item
  for update to authenticated using (true) with check (true);
create policy if not exists wishlist_item_delete on public.wishlist_item
  for delete to authenticated using (true);

create policy if not exists wishlist_item_resource_select on public.wishlist_item_resource
  for select to authenticated using (true);
create policy if not exists wishlist_item_resource_insert on public.wishlist_item_resource
  for insert to authenticated with check (true);
create policy if not exists wishlist_item_resource_update on public.wishlist_item_resource
  for update to authenticated using (true) with check (true);
create policy if not exists wishlist_item_resource_delete on public.wishlist_item_resource
  for delete to authenticated using (true);

-- Helpful indexes
create index if not exists idx_wishlist_item_vehicle on public.wishlist_item(vehicle_id);
create index if not exists idx_wishlist_item_status on public.wishlist_item(status);
create index if not exists idx_wishlist_item_priority on public.wishlist_item(priority);
create index if not exists idx_wishlist_item_resource_item on public.wishlist_item_resource(wishlist_item_id);
