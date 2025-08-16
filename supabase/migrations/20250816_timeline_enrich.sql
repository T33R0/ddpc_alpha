-- Timeline enrichment: title + occurred_at/on + date_confidence + manual_type_key
alter table if exists public.event
  add column if not exists title text,
  add column if not exists occurred_at timestamptz,
  add column if not exists occurred_on date,
  add column if not exists date_confidence text check (date_confidence in ('exact','approximate','unknown')),
  add column if not exists manual_type_key text;

-- Backfill occurred_at and date_confidence for existing rows
update public.event set occurred_at = created_at where occurred_at is null;
update public.event set date_confidence = 'exact' where date_confidence is null;

-- Extract manual_type_key from inline marker in notes, e.g., ::type=acquired::
update public.event
set manual_type_key = (regexp_match(notes, '::type=([a-z0-9_-]+)::'))[1]
where notes ~ '::type=([a-z0-9_-]+)::' and manual_type_key is null;

-- Strip the marker from notes for cleanliness
update public.event
set notes = nullif(btrim(regexp_replace(coalesce(notes,''), '::type=[^:]+::', '', 'g')), '')
where notes ~ '::type=[^:]+';


