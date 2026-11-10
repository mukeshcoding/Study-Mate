# StudyMate project notes

- This is a React + Vite frontend deployed to Vercel.
- Supabase Auth, Postgres, and Storage are the app backend.
- Apply database changes through versioned SQL files in `supabase/migrations/`.
- Only use `VITE_SUPABASE_URL` and the public anon/publishable key in browser code. Never expose a service-role key.
- Keep private user exports and local environment files out of Git.
- Do not delete or disable the previous Base44 project until the Supabase data, accounts, email flows, and Vercel deployment have been verified and a rollback window has passed.
