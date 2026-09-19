# Tally

A phone-friendly grade tracker. Import a syllabus, enter your scores, and see your grade the way Canvas shows it, plus a what-if predictor.

## Deploy
1. Put all of these files in a GitHub repo (the `src`, `public` folders and the files next to them).
2. In Netlify: Add new site, Import from GitHub, pick the repo. The settings are read from `netlify.toml` (build: `npm run build`, publish: `dist`).
3. Open the site on your phone, then Share > Add to Home Screen (iPhone) or menu > Install app (Android).

## Syncing between devices
Data always saves to the device it's on first (so the app still works offline). It also gets sent to a small
built-in Netlify Function, so you can pull the same data down on another device — no account or setup beyond
deploying the site.

1. Deploy the site as usual (see above). That's it — the sync function deploys automatically with everything else.
2. Open the site and go to **Settings**. You'll see a code like `AB3DE-F7GH2`, unique to this device.
3. On your other device, open the site, go to Settings, and type that same code into the "Setting up a new device?"
   box, then tap **Link this device**. The two devices now share the same code and sync automatically after that.

Notes:
- This is last-write-wins sync, checked when you open the app, switch back to the tab, and a second or so after any
  edit. It's built for one person using two of their own devices, not simultaneous multi-user editing.
- Anyone who has your code could read or overwrite that data — there's no password behind it, just the code itself.
  The codes are random and long enough that guessing one isn't realistic, but don't post yours publicly.

## Run locally
```
npm install
npm run dev
```
Note: `npm run dev` (Vite) won't serve the `/api/sync` function, so sync only works once deployed to Netlify. To
test sync locally too, install the Netlify CLI and run `netlify dev` instead.

## Import format
```
[Homework 30%]
Homework 1 | 20
Homework 2 | 20
[Exams 40%]
Midterm | 100 | 87     <- third value = score you already earned
Final | 150
```
