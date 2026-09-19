# Tally

A phone-friendly grade tracker. Import a syllabus, enter your scores, and see your grade the way Canvas shows it, plus a what-if predictor.

## Deploy
1. Put all of these files in a GitHub repo (the `src`, `public` folders and the files next to them).
2. In Netlify: Add new site, Import from GitHub, pick the repo. The settings are read from `netlify.toml` (build: `npm run build`, publish: `dist`).
3. Open the site on your phone, then Share > Add to Home Screen (iPhone) or menu > Install app (Android).

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
