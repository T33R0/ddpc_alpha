# Alpha Environment Setup (Supabase + Next.js)

Set these environment variables in `alpha/.env.local` (do not commit):

- NEXT_PUBLIC_SUPABASE_URL=
- NEXT_PUBLIC_SUPABASE_ANON_KEY=

Steps:
1) Create a Supabase project. Copy the Project URL and anon key into `.env.local`.
2) In Supabase Auth:
   - Enable Email (magic links)
   - Enable Google OAuth (later; optional for now). Add redirect: http://localhost:3000
3) In Supabase Storage:
   - Create a bucket `vehicle-media` (public)
4) In Database:
   - We will create tables via SQL/Studio shortly (vehicles, work_items, events, media, garages, garage_members).

Run dev:

```bash
npm run dev
```
