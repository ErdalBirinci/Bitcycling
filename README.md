# Bitcycling — Public Demo 🚴

**Ride. Earn. Repeat.** A social cycling app that turns every kilometer into **BTCYC**:
every 20 km = 1 BTCYC (100 km/day cap, 40 km/h speed limit), redeemable for real products in the marketplace.

## Live demo

| | Link |
|---|---|
| 🌐 **Landing page** — *start here* | https://erdalbirinci.github.io/Bitcycling/ |
| 🚴 **PWA** (ride · market · events · profile) | https://erdalbirinci.github.io/Bitcycling/app.html |

**PWA demo sign-in:** `alex@bitcycling.app` · 2FA code `240519` — or use *Explore with demo data*.

## Files

| File | Purpose |
|---|---|
| `index.html` + `web.css` + `web.js` | Landing page (front door) |
| `app.html` + `styles.css` + `app.js` | Installable PWA (the app itself) |
| `web.html` | Legacy link → redirects to the landing page |
| `manifest.webmanifest` · `sw.js` · `icon.svg` | PWA manifest, offline service worker, icon |

## Notes

- Mobile-first PWA, vanilla HTML/CSS/JS, no build step and no backend: all state lives in `localStorage`.
- Light modern theme (emerald `#059669`, gold BTCYC), dark mode included, installable via the web manifest.
- This repository holds the **deployable demo build** only; development happens in a separate private repository.

---

Ride. Earn. Repeat.
