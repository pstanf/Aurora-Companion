# Aurora Companion — Launch Guide

Everything in this folder (`aurora-app/`) is the complete, deployable app. Three steps to go live: set up the events sheet, host the folder, point your domain at it.

---

## Step 1 — The alumni events Google Sheet ✅ DONE (already connected)

The app is connected to this sheet:
https://docs.google.com/spreadsheets/d/1B_Y_Y4iy8bMU5LZNZFxjrb0BO_zHczoXQBGlU0RPkqU/edit

Staff just add rows — one per event:

| Title | Date | Time | Location | Description |
|-------|------|------|----------|-------------|
| Alumnae Connection Circle | 2026-06-18 | 6:00–7:30 PM | Aurora, Danvers | Our monthly peer support circle... |

Rules of the sheet:

- **Date** must be `YYYY-MM-DD` (e.g. `2026-06-18`). Past events disappear from the app automatically — no cleanup needed.
- Leave **Date blank** for recurring events ("Third Thursday monthly") — they always show.
- Keep row 1 (the headers) exactly as it is.
- Until the sheet has at least one event row, the app shows its built-in sample events.
- Changes appear in the app the next time someone opens it (within minutes).

> Notes: the sheet must stay readable by "anyone with the link" (it currently is — don't change sharing to restricted, or the app can't read it). And since it's publicly readable, only put event info you'd happily print in a brochure.

---

## Step 2 — Host on Vercel with GitHub (automated deploys)

The app is a static site (HTML/CSS/JS). Connect GitHub once; every push to `main` deploys to production automatically. Pull requests get preview URLs.

### First-time setup (~10 min)

1. Sign in at [vercel.com](https://vercel.com) with the same GitHub account as the repo.
2. Click **Add New → Project**.
3. Import **`pstanf/Aurora-Companion`** from GitHub (authorize Vercel if prompted).
4. Project settings (defaults are fine for this app):
   - **Framework Preset:** Other
   - **Root Directory:** `.` (repo root — all app files are at the top level)
   - **Build Command:** leave empty
   - **Output Directory:** leave empty or `.`
5. Click **Deploy**. Vercel builds and gives you a `*.vercel.app` URL.
6. **Custom domain:** Project → **Settings → Domains** → add `app.auroraforwomen.com`.  
   If you already deployed via Vercel Drop, open the existing project and use **Settings → Git** to connect this repo instead of creating a duplicate.

### How updates work (CI/CD)

| Action | What happens |
|--------|----------------|
| Push to `main` | Production deploy → live at `app.auroraforwomen.com` |
| Open a Pull Request | Vercel posts a **Preview URL** for that branch |
| Merge PR to `main` | Preview becomes production |

After changing `sw.js`, bump the `CACHE` version string so phones pick up the new service worker.

### Secrets and `.gitignore`

This app has **no server-side secrets** in the repo. Journal passcodes and check-ins stay in each user’s browser only.

Do **not** commit:

- `.env` files
- `.vercel/` (created if you run the Vercel CLI locally)
- `config.local.js` (optional local overrides — see `config.local.example.js`)

These are listed in `.gitignore`. The Google Sheet URL in `config.js` is intentionally public (published CSV for events).

### Optional: Vercel CLI

```powershell
npm i -g vercel
cd aurora-app
vercel link
vercel --prod
```

Use the dashboard Git integration for day-to-day deploys; CLI is optional.

---

## Step 2 (legacy) — Manual Netlify upload

<details>
<summary>Older manual deploy (not recommended if using Git + Vercel)</summary>

1. Create a free account at [netlify.com](https://netlify.com).
2. **Add new site → Deploy manually** and drag the `aurora-app` folder.
3. Re-upload the folder after each change.

</details>

---

## Step 3 — Use your domain via GoDaddy DNS (~10 min + propagation)

The domain is registered at GoDaddy; the main website stays on Squarespace untouched. You're only adding a subdomain record.

1. In Vercel: **Project → Settings → Domains** → confirm `app.auroraforwomen.com` is listed (or add it).
2. Log in at [godaddy.com](https://godaddy.com) → **My Products → auroraforwomen.com → DNS**, then confirm or add:
   - **Type:** CNAME
   - **Name:** `app`
   - **Value:** `cname.vercel-dns.com` (or the target Vercel shows in the Domains panel)
   - **TTL:** leave the default
3. Save, then wait for DNS to propagate (usually under an hour). Vercel issues HTTPS automatically once DNS is correct.

> If you previously pointed `app` at Netlify, **change the CNAME value** to Vercel’s target. Don’t touch Squarespace or email (MX) records.

Result: **https://app.auroraforwomen.com** — free hosting, free SSL, main website untouched.

---

## Telling people about it

- Generate a QR code pointing to `app.auroraforwomen.com` and add it to the tri-fold brochure, discharge packets, and the alumnae newsletter.
- On phones, visiting the link offers **"Add to Home Screen"** — the app installs with the Aurora logo and works offline.
- Suggested script for clinicians: *"This is our companion app for the moments between sessions — check-ins, breathing tools, journaling, and our alumnae events. Everything you write stays on your phone."*

## Before launch checklist

- [ ] Clinical team reviews all in-app language (affirmations, prompts, low-mood support card)
- [ ] Replace placeholder events in the Google Sheet with the real schedule
- [ ] Confirm phone number, email, and address shown in the Connect tab
- [ ] Test "Add to Home Screen" on one iPhone and one Android
- [ ] Decide who owns the Google Sheet and the Vercel/GitHub logins (write it down!)

## What this costs

| Item | Cost |
|------|------|
| Vercel hosting (Hobby) | $0 |
| Google Sheet | $0 |
| SSL certificate | $0 (automatic) |
| Subdomain | $0 (you own the domain) |
| **Total** | **$0/month** |
