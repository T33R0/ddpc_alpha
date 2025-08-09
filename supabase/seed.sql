-- Seed data for GitHub for Automobiles (Alpha)
-- NOTE:
-- - This script is designed to run in Supabase SQL Editor or psql.
-- - If RLS is enabled with owner-only policies (as recommended), you must run this
--   using the service role (SQL Editor) or replace placeholders with real IDs.
-- - Replace the placeholders below before running:
--     <USER_ID>      uuid of the user (auth.users.id)
--     <GARAGE_ID>    uuid of an existing garage owned by <USER_ID>
--
-- Create a demo garage owned by the provided user
insert into public.garage (id, name, owner_id)
values ('00000000-0000-0000-0000-000000000001', 'My Garage', 'd9280e6f-f516-421f-b977-8900d53d6aa2')
on conflict (id) do nothing;
--
-- Optional: add the owner as a member (if your schema has garage_member)
-- insert into public.garage_member (garage_id, user_id, role)
-- values ('<GARAGE_ID>', '<USER_ID>', 'OWNER')
-- on conflict do nothing;
--
-- Vehicle seed
insert into public.vehicle (id, garage_id, owner_id, nickname, privacy, vin, year, make, model, trim, photo_url)
values (
  '00000000-0000-0000-0000-0000000000aa',
  '00000000-0000-0000-0000-000000000001',
  'd9280e6f-f516-421f-b977-8900d53d6aa2',
  'Demo Car',
  'PRIVATE',
  '1HGBH41JXMN109186',
  2015,
  'Subaru',
  'WRX',
  'Premium',
  null
)
on conflict (id) do nothing;

-- Work items for the vehicle (Kanban tasks)
insert into public.work_item (id, vehicle_id, title, status, tags, due)
values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000aa', 'Change oil and filter', 'BACKLOG', ARRAY['maintenance'], now() + interval '7 days'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000aa', 'Replace brake pads', 'IN_PROGRESS', ARRAY['brakes','safety'], null),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000aa', 'Detail interior', 'DONE', ARRAY['cleaning'], null)
ON CONFLICT (id) DO NOTHING;

-- Timeline events (if your schema uses `work_event` table)
-- Uncomment if present in your schema:
-- insert into public.work_event (id, vehicle_id, title, notes, occurred_at)
-- values
--   ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000aa', 'Purchased vehicle', 'Initial purchase', now() - interval '365 days'),
--   ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000aa', 'Oil change', '5W-30 synthetic', now() - interval '45 days')
-- on conflict (id) do nothing;
