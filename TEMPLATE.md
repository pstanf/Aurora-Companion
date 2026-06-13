# Treatment Center Companion — Template Guide

This app is a single-page PWA you can fork for other centers. Most site-specific values live in **`config.js`**.

## Quick start (new center)

1. **Copy** the `aurora-app` folder and rename it (e.g. `oak-companion`).
2. **Edit `config.js`** — update the `SITE` object (name, contact, colors, sounds, events sheet URL, storage prefix).
3. **Replace assets** — emblem, icons, hero background, optional MP3s in `sounds/`.
4. **Edit copy in `index.html`** — welcome trust badges, program descriptions, alumnae intro, disclaimers (search for "Aurora").
5. **Update `manifest.webmanifest`** — `name`, `short_name`, theme/background colors, icon paths.
6. **Bump service worker cache** in `sw.js` — change the version string in `CACHE` (e.g. `v61` → `v62`) after any deploy so clients pick up changes.
7. **Deploy** to Netlify or similar (static hosting, no build step).

## `config.js` — what to change

| Field | Purpose |
|-------|---------|
| `storagePrefix` | localStorage key prefix — **change per center** so data never collides |
| `name`, `nameUpper`, `tagline` | Branding in hero headers |
| `welcomeTagline`, `welcomeLead` | Onboarding screen |
| `companionTitle`, `pageDescription`, `themeColor` | Browser tab, meta tags |
| `homeTagline` | Default home subtext |
| `phone`, `phoneDisplay`, `email`, `website`, `websiteDisplay`, `address` | Connect tab + RSVP mailto |
| `emblem`, `heroBg` | Image paths |
| `eventsSheetUrl` | Published Google Sheet CSV URL (leave empty to use built-in defaults) |
| `trustBadges`, `connectBadges` | Reference lists (welcome/connect copy is still in HTML today) |
| `ambientSounds`, `soundFiles` | Breathe/Ground sound picker + MP3 paths |

Content arrays in the same file (`AFFIRMS`, `PROMPTS`, `MOODS`, `FEELINGS`) can be customized per center.

## File layout

```
index.html      Shell markup — screens, nav, no inline CSS/JS
styles.css      All styles
config.js       SITE config + shared content arrays + storage helper
daily-meditations.js   365 daily readings (optional to replace)
audio.js        Ambient + Rest audio engines
app.js          Screens, check-in, tools logic, events, init
ui.js           Branding injection, sound pickers, click delegation
sw.js           Offline cache (bump version on deploy)
manifest.webmanifest   PWA install metadata
sounds/         MP3 assets (optional procedural fallback for ocean/rain)
```

## Google Sheet events (optional)

Publish a sheet to the web as CSV. Columns: `date`, `title`, `time`, `location`, `description`. Set `SITE.eventsSheetUrl` to the `gviz/tq?tqx=out:csv` URL. If fetch fails (offline), cached or default events show.

## Brand colors

CSS variables live in `styles.css` under `:root` (`--navy`, `--orange`, etc.). Match these to your center's palette and set `themeColor` in `config.js` + `manifest.webmanifest`.

## Testing checklist

- [ ] Welcome → name → home
- [ ] Check-in saves mood + feelings
- [ ] Breathe + Ground: sound bath / meditation on tap
- [ ] Rest: Hz tracks play and loop
- [ ] Daily reflection + journal
- [ ] Connect: phone/email links
- [ ] Add to Home Screen (iOS + Android)
- [ ] Airplane mode: app loads from cache

## Deploy notes

- No build step — upload the folder as-is.
- Use HTTPS (required for service worker).
- After deploy, hard-refresh once or reinstall PWA to get the new service worker.
