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

## How the adaptive engine works

The app tracks your accuracy on five skills — recognizing, pronouncing,
listening, recalling and writing — as an exponentially-weighted moving
average. **Smart sessions** keep the spaced-repetition scheduler in charge of
*which* characters you see, but pick *how* each one is practiced by sampling
skills weighted toward your weak spots (with a floor so strong skills stay in
rotation — that's interleaving). The "How you learn" panel on Today shows your
live profile. Until a skill has 3 attempts it sits at a neutral prior, so the
app doesn't overreact to your first few answers.

## Files

| File | Purpose |
|---|---|
| `index.html` | All five views (Today / Learn / Quiz / Write / Browse) |
| `css/style.css` | "Ink & Paper" design system (tokens, night-ink dark mode) |
| `js/data.js` | Character data — generated, run `node ../tools/build-data.mjs` |
| `js/srs.js` | Spaced-repetition scheduler + progress storage (localStorage) |
| `js/adaptive.js` | Adaptive engine: skill tracking, session weighting, daily goal |
| `js/ui.js` | Panda mascot, theme toggle, confetti, count-up animations |
| `js/app.js` | App logic: smart sessions, flashcards, quizzes, stroke practice |
| `sw.js` | Service worker — offline caching |
| `manifest.webmanifest` | PWA manifest (icons, name, home-screen shortcuts) |

## A note on widgets

True home-screen widgets aren't possible for web apps on iOS/Android — that's
what the [`mobile-app/`](../mobile-app/) option is for. The PWA's equivalent
is the **Today tab** (character of the day) and the app-shortcut ("Start
review") you get on long-pressing the installed icon on Android.
