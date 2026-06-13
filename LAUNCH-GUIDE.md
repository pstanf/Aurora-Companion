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

## Step 2 — Host the app on Netlify (free, ~10 min)

1. Create a free account at [netlify.com](https://netlify.com) (use the center's email).
2. From the dashboard choose **Add new site → Deploy manually**.
3. Drag the entire `aurora-app` folder onto the upload area.
4. Done — you'll get a URL like `aurora-companion.netlify.app`. Open it on a phone to confirm.

To update the app later (e.g. after pasting the sheet URL in Step 1), just drag the folder onto the site's **Deploys** page again.

---

## Step 3 — Use your domain via GoDaddy DNS (~10 min + propagation)

The domain is registered at GoDaddy; the main website stays on Squarespace untouched. You're only adding a subdomain record.

1. In Netlify: **Site settings → Domain management → Add a domain** → enter `app.auroraforwomen.com`.
2. Log in at [godaddy.com](https://godaddy.com) → **My Products → auroraforwomen.com → DNS** (or "Manage DNS"), then **Add New Record**:
   - **Type:** CNAME
   - **Name:** `app`
   - **Value:** your Netlify site address (e.g. `aurora-companion.netlify.app`)
   - **TTL:** leave the default
3. Save, then wait for DNS to propagate (usually under an hour). Netlify issues the HTTPS certificate automatically once it sees the record.

> Careful: don't touch any existing records (especially the ones pointing the bare domain/`www` at Squarespace, or MX records for email). You're only **adding** one new record.

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
- [ ] Decide who owns the Google Sheet and the Netlify login (write it down!)

## What this costs

| Item | Cost |
|------|------|
| Netlify hosting | $0 |
| Google Sheet | $0 |
| SSL certificate | $0 (automatic) |
| Subdomain | $0 (you own the domain) |
| **Total** | **$0/month** |
