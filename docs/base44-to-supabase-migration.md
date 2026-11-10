# StudyMate: Base44 to Supabase migration

## Current state

- The Vercel production deployment remains on the stable `main` branch.
- Migration work is isolated on `codex/supabase-migration` and is not published.
- The migration schema below covers profiles, subjects, tasks, exams, study sessions, habits, habit logs, notes, and avatar storage.
- No Base44 project, users, or records have been deleted or changed.

## Target services

- Vercel: static frontend hosting and deployments.
- Supabase Auth: email/password, verification, password recovery, and Google OAuth.
- Supabase Postgres: app records protected by per-user row-level security.
- Supabase Storage: profile images.
- Resend or another SMTP provider: production authentication email delivery.

Vercel hosts the frontend, but the app still needs a database, auth service, file storage, and reliable SMTP. The Supabase SMTP service is restricted for production; configure custom SMTP before opening registration to the public.

## Supabase project setup

1. Create a Supabase project in the owner's account and keep the Base44 app live during migration.
2. Apply `supabase/migrations/20261110000000_studymate_schema.sql` in the Supabase SQL editor.
3. In Authentication URL configuration, set the Site URL to the Vercel production URL and allow that URL plus the local development URL for redirects.
4. Enable email/password sign-in and set the confirmation email template to include the six-digit `{{ .Token }}` value. Keep `/reset-password` as the recovery destination.
5. Configure custom SMTP using a verified sender domain. Publish the provider's SPF and DKIM records and a DMARC policy before sending production auth mail.
6. If retaining Google sign-in, configure its OAuth client in Supabase and update the Google OAuth redirect URI to the Supabase callback URL. Add the Vercel production and local development redirect URLs to the allow list.
7. Copy the Supabase project URL and public anon/publishable key into Vercel's Production, Preview, and Development environments as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never put a service-role key in Vite variables or browser code.

## Data and account migration

1. In Base44 Data, export the seven app data tables (`Subject`, `Task`, `Exam`, `StudySession`, `Habit`, `HabitLog`, and `Note`) separately as CSV files. Base44 documents the table-by-table CSV export in its [data management guide](https://docs.base44.com/Building-your-app/Managing-your-app-data). Keep exports private and out of Git.
2. Review the separate App Users area for the account list and any supported export. Do not treat the seven data-table exports as an account or password export. If a user email list or portable credential export is unavailable, existing users will need to register or sign in again on StudyMate.
3. Map each exported record's Base44 owner ID to the corresponding Supabase Auth UUID before import. Import rows with the mapped `user_id`; preserve each record's `id`, `created_date`, and `updated_date` where possible so record links remain stable.
4. Keep the app in maintenance/limited rollout until imported row counts and ownership are checked. Confirm that every account can see only its own records.
5. Never copy or log passwords. Authentication credentials are handled by the existing identity provider and should not be treated as portable from CSV exports.

## Cutover and rollback

1. Set the Supabase variables in Vercel Preview first and test a preview deployment.
2. Verify signup + email confirmation, login, Google OAuth, forgot/reset password, profile update, avatar upload, and create/read/update/delete for every app table.
3. Import the production data and compare per-table counts and a few records per user.
4. Only after those checks pass, set the same variables for Production and deploy the migration branch through a reviewed merge to `main`.
5. Keep the Base44 app and its data untouched through a rollback window. If the new app fails, roll Vercel back and continue using Base44.
6. Remove Base44 only after the Vercel app has been confirmed stable and the exports/backups are retained. Deleting the Base44 project before cutover would break the current auth and data APIs.

## Still required before cutover

- A Supabase project URL and public anon/publishable key.
- A verified sender domain and SMTP credentials for production auth emails.
- A private export of the production Base44 tables.
- Google OAuth credentials/redirect setup if Google login should continue.
- A verified import of all production users and data.
