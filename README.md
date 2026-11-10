# StudyMate

StudyMate is a React and Vite study planner. The frontend is hosted on Vercel; Supabase provides authentication, PostgreSQL data, and avatar storage.

## Run locally

1. Install Node.js 20.19+ or 22.12+ and pnpm.
2. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and public anon/publishable key.
3. Install dependencies with `pnpm install`.
4. Start the app with `pnpm dev`.

## Supabase setup

Apply `supabase/migrations/20261110000000_studymate_schema.sql` in a new Supabase project. Configure the Site URL and allowed auth redirects for the Vercel domain, enable email/password authentication, configure Google OAuth if required, and set custom SMTP with a verified sender domain before enabling production registration.

Never put a Supabase service-role key in the frontend or in a `VITE_` environment variable. The browser app uses only the public anon/publishable key and database row-level security.

## Vercel deployment

- Framework preset: Vite
- Build command: `pnpm build`
- Output directory: `dist`
- Install command: `pnpm install`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the required Vercel environments.

`vercel.json` routes client-side app paths back to `index.html`.

## Moving from Base44

See [`docs/base44-to-supabase-migration.md`](docs/base44-to-supabase-migration.md) for data export, account migration, email setup, preview verification, cutover, and rollback steps. Keep private exports out of Git and retain the Base44 project until the new production deployment is verified.
