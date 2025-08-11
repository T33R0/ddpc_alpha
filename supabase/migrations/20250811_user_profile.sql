create table if not exists public.user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  location text,
  website text,
  bio text,
  avatar_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profile enable row level security;

-- Allow anyone to read profiles marked public
create policy up_read_public on public.user_profile for select using (is_public = true);
-- Allow users to read their own profile regardless of visibility
create policy up_read_self on public.user_profile for select using (auth.uid() = user_id);
-- Allow users to insert their own profile
create policy up_insert_self on public.user_profile for insert with check (auth.uid() = user_id);
-- Allow users to update their own profile
create policy up_update_self on public.user_profile for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
