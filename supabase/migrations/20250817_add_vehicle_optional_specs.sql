-- Add optional spec fields to vehicle table
alter table if exists public.vehicle
  add column if not exists cylinders int,
  add column if not exists displacement_l numeric,
  add column if not exists transmission text;


