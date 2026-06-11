# 汉字 Trainer — Web App (PWA)

A zero-dependency, installable progressive web app. No build step, no
framework — just open it. **Opening the app lands you straight on a card**:
the deck is the whole product; Characters and Me are reference surfaces.

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

## How the deck works

The spaced-repetition scheduler decides *which* card you see (due cards
first, then up to 10 new per day); the adaptive engine decides *how* it's
asked, sampling card fronts weighted toward your weakest skills — recognizing,
pronouncing, listening, recalling — with a floor so strong skills stay in
rotation (interleaving). Accuracy per skill is an exponentially-weighted
moving average; until a skill has 3 attempts it sits at a neutral prior. New
characters appear as "meet cards" (no quiz), then come straight back as their
own first retrieval. When nothing is worth reviewing, the app says so and
tells you to leave.

## Files

| File | Purpose |
|---|---|
| `index.html` | The deck (Learn) + Characters + Me, and the detail sheet |
| `css/style.css` | "Ink & Paper" design system (tokens, night-ink dark mode) |
| `js/data.js` | Character data — generated, run `node ../tools/build-data.mjs` |
| `js/srs.js` | Spaced-repetition scheduler + progress storage (localStorage) |
| `js/adaptive.js` | Adaptive engine: skill tracking, session weighting, daily goal |
| `js/ui.js` | Panda mascot, theme toggle, confetti, count-up animations |
| `js/app.js` | The deck loop, reference surfaces, detail sheet |
| `sw.js` | Service worker — offline caching |
| `manifest.webmanifest` | PWA manifest (icons, name, home-screen shortcuts) |

## A note on widgets

True home-screen widgets aren't possible for web apps on iOS/Android — that's
what the [`mobile-app/`](../mobile-app/) option is for (the native widget code
already exists there). The PWA's equivalent is the **character of the day** on
the Me tab and the installed home-screen icon that drops you straight onto a
card. Web, app, and widgets all compute the daily character the same way
(`dayOfYear % 155`), so every surface always agrees.
