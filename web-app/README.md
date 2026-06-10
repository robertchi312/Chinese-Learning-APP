# 汉字 Trainer — Web App (PWA)

A zero-dependency, installable progressive web app. No build step, no
framework — just open it.

## Run locally

```bash
cd web-app
python3 -m http.server 8000    # or: npx serve
```

Open http://localhost:8000. (A web server is needed for the service worker
and offline mode; opening `index.html` directly also works for everything
except offline caching.)

## Install it like a real app

- **Android (Chrome):** open the site → you'll get an install banner, or
  menu ⋮ → *Add to Home Screen*. It launches fullscreen with its own icon.
- **iPhone (Safari):** Share button → *Add to Home Screen*.
- **Desktop (Chrome/Edge):** install icon in the address bar.

Once installed it works **fully offline** (stroke-order animations need one
online visit per character to cache the data).

## Deploy for free

Any static host works. Easiest: **GitHub Pages** —
repo Settings → Pages → deploy from branch, folder `/web-app`.
Or drag the folder into Netlify / Vercel.

## Files

| File | Purpose |
|---|---|
| `index.html` | All five views (Today / Learn / Quiz / Write / Browse) |
| `js/data.js` | Character data (generated from `../shared/characters.json`) |
| `js/srs.js` | Spaced-repetition scheduler + progress storage (localStorage) |
| `js/app.js` | App logic: flashcards, quiz, stroke practice, browse, install prompt |
| `sw.js` | Service worker — offline caching |
| `manifest.webmanifest` | PWA manifest (icons, name, home-screen shortcut) |

## A note on widgets

True home-screen widgets aren't possible for web apps on iOS/Android — that's
what the [`mobile-app/`](../mobile-app/) option is for. The PWA's equivalent
is the **Today tab** (character of the day) and the app-shortcut ("Start
review") you get on long-pressing the installed icon on Android.
