This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# DDPC Alpha (Next.js + Supabase)

This is the alpha for the "GitHub for Automobiles" app. It uses Next.js App Router and Supabase (Auth, Postgres, Storage).

## Environment Setup

- Copy `env.sample` to `.env.local` and set values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- Supabase Auth settings:
  - Enable Email (magic link)
  - (Optional) Enable Google OAuth; add redirect URLs:
    - `http://localhost:3000`
    - `https://<your-vercel-domain>.vercel.app`

- Supabase Storage:
  - Create a public bucket, e.g., `vehicle-media` (if images are used)

## Run locally

```
npm install
npm run dev
# http://localhost:3000
```

## Deploy to Vercel

1) Import this repo in Vercel (New Project). Use defaults for a Next.js app.

2) Add Project Environment Variables (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3) Supabase Auth → URL configuration:
   - Site URL: `https://<your-vercel-domain>.vercel.app`
   - Additional Redirect URLs: include both local and Vercel URL

4) Verify in production:
   - Sign-in (email/Google)
   - Vehicles CRUD and image upload
   - Tasks board: create with tags/due, drag-and-drop, delete
   - Timeline: create, filter, group by month, delete

## Notes

- `.env.local` should not be committed. Use `env.sample` to share required keys.
- Next.js/Tailwind/React versions are pinned in `package.json`.
