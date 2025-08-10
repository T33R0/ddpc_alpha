create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
create policy us_read_self  on public.user_settings for select using (auth.uid() = user_id);
create policy us_upsert_self on public.user_settings for insert with check (auth.uid() = user_id);
create policy us_update_self on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
