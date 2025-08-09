-- Task templates (global + garage-scoped)
create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('GLOBAL','GARAGE')),
  garage_id uuid null references public.garage(id) on delete cascade,
  title text not null,
  default_tags text[] not null default '{}',
  default_due_interval_days int null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.task_templates enable row level security;

create policy templates_select_global_or_my_garage on public.task_templates for select using (
  (scope = 'GLOBAL')
  or (scope = 'GARAGE' and garage_id in (
    select gm.garage_id from public.garage_member gm where gm.user_id = auth.uid()
  ))
);

create policy templates_insert_garage_owner_manager_only on public.task_templates for insert with check (
  (scope = 'GARAGE') and (garage_id in (
    select gm.garage_id from public.garage_member gm where gm.user_id = auth.uid() and gm.role in ('OWNER','MANAGER')
  ))
);

create policy templates_update_by_creator on public.task_templates for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy templates_delete_by_creator on public.task_templates for delete using (created_by = auth.uid());


