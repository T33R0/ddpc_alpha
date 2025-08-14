### Discover / Compare / Image Cache schema

This feature introduces three tables and RLS policies to support image caching for vehicle discovery, optional saved discover filters, and user-scoped comparison sets.

Tables:

- **public.vehicle_images**: cache of vehicle images fetched from external sources.
  - `id uuid pk`, `vehicle_id uuid → public.vehicles(id)`, `source_url text`, `storage_path text`, `width int`, `height int`, `hash text`, `status text default 'ready'`, `fail_count int default 0`, `last_checked_at timestamptz`, `created_at timestamptz`, `updated_at timestamptz`.
  - Indexes: `(vehicle_id)`, `(status)`.
  - Trigger: `trg_vi_touch` updates `updated_at` on update via `public.touch_updated_at()`.
  - RLS: public read; writes allowed only to service role.

- **public.discover_filters**: optional saved filters for signed-in users.
  - `id uuid pk`, `user_id uuid → auth.users(id)`, `name text`, `query jsonb`, `created_at timestamptz`.
  - Index: `(user_id)`.
  - RLS: user can read/write only their own rows.

- **public.vehicle_comparisons**: user-defined sets of up to four vehicles for comparison.
  - `id uuid pk`, `user_id uuid → auth.users(id)`, `vehicle_ids uuid[]`, `title text`, `created_at timestamptz`.
  - Index: `(user_id)`.
  - RLS: user can read/write only their own rows.

RLS policies:

- `vehicle_images`
  - Select: `using (true)`
  - All (insert/update/delete): `using (auth.role() = 'service_role') with check (auth.role() = 'service_role')`

- `discover_filters` and `vehicle_comparisons`
  - All: `using (auth.uid() = user_id) with check (auth.uid() = user_id)`

Vehicles source table:

- Reference only. Expected fields used by discover: `id`, `year`, `make`, `model`, `trim`, `body_style`, `cylinders`, `induction`, `drivetrain`, `doors`, `transmission`, `fuel_type`, `displacement_l`, `power_hp`, `torque_lbft`.
- This project already uses `public.vehicles (id uuid)` elsewhere; foreign keys here align to that.

Storage bucket:

- Ensure a Supabase Storage bucket named `discover-images` exists.
  - Public read is required for serving cached images.
  - Writes should be performed by the service role only.
  - If not provisioned automatically, create it manually in Supabase Studio → Storage.


