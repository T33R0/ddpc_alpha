-- Security Test: IDOR block for event cross-vehicle update
-- Usage: psql -v ON_ERROR_STOP=1 -f event_idor_block.sql
-- Supabase roles via JWT claims; no schema edits.

begin;

-- Test identities
\set user_a '00000000-0000-0000-0000-00000000000a'
\set user_b '00000000-0000-0000-0000-00000000000b'

-- Helper: set actor to authenticated with sub claim
create or replace function _set_actor(actor uuid) returns void as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', actor::text)::text, true);
  perform set_config('role', 'authenticated', true);
end; $$ language plpgsql;

-- Create garage A (owner user_a), vehicle_a
select _set_actor(:'user_a'::uuid);
insert into garage (name, owner_id) values ('ga', :'user_a'::uuid) returning id \gset
insert into vehicle (garage_id, make, model, privacy) values (:'id', 'M', 'A', 'PRIVATE') returning id \gset
\set vehicle_a :'id'

-- Create garage B (owner user_b), vehicle_b
select _set_actor(:'user_b'::uuid);
insert into garage (name, owner_id) values ('gb', :'user_b'::uuid) returning id \gset
insert into vehicle (garage_id, make, model, privacy) values (:'id', 'M', 'B', 'PRIVATE') returning id \gset
\set vehicle_b :'id'

-- As user_a: create event under vehicle_a
select _set_actor(:'user_a'::uuid);
insert into event (vehicle_id, type) values (:'vehicle_a'::uuid, 'SERVICE') returning id \gset
\set event_id :'id'

-- As user_a: attempt to move event to vehicle_b (should FAIL via RLS: zero rows updated)
with upd as (
  update event set vehicle_id = :'vehicle_b'::uuid where id = :'event_id'::uuid returning id
)
select case when exists (select 1 from upd) then 1/0 else 1 end;

rollback;
