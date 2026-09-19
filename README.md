# Tally

A phone-friendly grade tracker. Import a syllabus, enter your scores, and see your grade the way Canvas shows it, plus a what-if predictor.

## Deploy
1. Put all of these files in a GitHub repo (the `src`, `public` folders and the files next to them).
2. In Netlify: Add new site, Import from GitHub, pick the repo. The settings are read from `netlify.toml` (build: `npm run build`, publish: `dist`).
3. Open the site on your phone, then Share > Add to Home Screen (iPhone) or menu > Install app (Android).

## Syncing between devices (Supabase)
Data always saves to the device it's on first (so the app still works offline). If you add Supabase, signing in on
two devices with the same email keeps them in sync too.

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard: **SQL Editor** → New query → paste in `supabase/schema.sql` → Run. This creates the
   table that stores everyone's data, one row per user, locked down so each person can only see their own row.
3. In **Authentication → Providers**, make sure **Email** is enabled. In **Authentication → URL Configuration**, add
   your Netlify site URL (e.g. `https://your-site.netlify.app`) to both "Site URL" and "Redirect URLs" — otherwise
   the sign-in link will bounce.
4. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
5. In Netlify: **Site configuration → Environment variables**, add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
   Then trigger a new deploy (env vars only take effect on the next build).
6. On the site, open **Settings → Sync across devices**, enter your email, and open the link it sends you. Do the
   same on your other device with the same email — they'll sync automatically after that.

For local development, copy `.env.example` to `.env` and fill in the same two values, then `npm run dev`.

Notes:
- The anon key is safe to expose in client code — it's the row-level-security policies in `schema.sql` that keep
  each person's data private, not secrecy of the key.
- This is last-write-wins sync, checked on sign-in and whenever you switch back to the tab/app. It's built for one
  person using two of their own devices, not simultaneous multi-user editing.

## Run locally
```
npm install
npm run dev
```

## Import format
```
[Homework 30%]
Homework 1 | 20
Homework 2 | 20
[Exams 40%]
Midterm | 100 | 87     <- third value = score you already earned
Final | 150
```
