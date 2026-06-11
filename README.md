# 汉字 Trainer — Learn Chinese Characters

> **The science does the work, not the user.** Zero friction to start, no
> discipline required — the evidence-based mechanics are baked into the
> design. Read the full [product philosophy](PHILOSOPHY.md).

Two complete apps for learning Chinese characters, sharing one dataset of
**155 HSK-1 level characters** (with pinyin, meanings, and example words):

| Option | Folder | What it is | Best for |
|---|---|---|---|
| 🌐 **Web app (PWA)** | [`web-app/`](web-app/) | Zero-install, works in any browser, installable to your home screen, fully offline | Start learning **right now** |
| 📱 **Mobile app** | [`mobile-app/`](mobile-app/) | Expo / React Native — builds into a **real iOS & Android app** with **native home-screen widgets** | The "real app" experience |
| 📦 **Shared data** | [`shared/`](shared/) | The character dataset both apps are generated from | Adding more characters |

**The product, in one line:** open the app and a flashcard is already there —
tap to flip, "Not yet / Got it", next card, close whenever. One learning
channel; everything else supports it.

- 🎴 **The Deck** — the only place learning happens. One gesture
  (tap-flip-judge), but the card front rotates between character, audio and
  meaning, picked invisibly by an adaptive engine that tracks five skills
  (recognizing, pronouncing, listening, recalling, writing) and leans toward
  your weak spots
- ✨ **Meet cards** — new characters introduce themselves (story, components,
  audio) before they quiz you; 10 new per day max, then the app tells you
  you're done
- 🗓️ **Character of the day** — on the Me tab, in the widget, and (next
  milestone) on your actual home screen via native widgets
- 📚 **Characters** — searchable reference list; tap any character anywhere
  for its detail sheet: memory story, component breakdown
  (好 = 女 woman + 子 child), stroke practice, audio
- 🐼 **Me** — streak, daily goal, progress stats, and the "How you learn"
  skill profile with plain-English science notes
- 🌙 Night-ink dark mode, confetti on milestones, offline-capable PWA,
  progress stored privately on-device

## Quick start (60 seconds)

```bash
cd web-app
python3 -m http.server 8000   # or: npx serve
# open http://localhost:8000
```

On your phone, open it in the browser → menu → **Add to Home Screen** and it
behaves like an installed app, offline included.

## Building the real mobile app

See [`mobile-app/README.md`](mobile-app/README.md) — it runs instantly on your
phone via Expo Go, and builds into a real installable APK / App Store app with
EAS Build. Widget setup lives in
[`mobile-app/widgets/android/`](mobile-app/widgets/android/README.md) and
[`mobile-app/widgets/ios/`](mobile-app/widgets/ios/README.md).

## How the daily character & widgets stay in sync

The "character of the day" is computed as `dayOfYear % 155` everywhere — web
app, mobile app, Android widget, iOS widget — so all of them always show the
same character with zero syncing or networking.

## Adding more characters

Edit `shared/characters.json` (each entry needs char, pinyin, meaning, an
example word, components and a mnemonic), then run `node tools/build-data.mjs`
to regenerate `web-app/js/data.js`. The mobile data files
(`mobile-app/src/data/characters.ts`, the widget assets) are generated from
the same JSON — regenerating those automatically is a planned improvement.

## Development tools

```bash
node tools/build-data.mjs     # regenerate web data from shared/characters.json
node tools/test-adaptive.mjs  # adaptive-engine + SRS logic tests
node tools/snapshot.mjs       # Playwright screenshots of every view (needs playwright)
```

## Roadmap ideas

- HSK 2–6 character packs
- Tone-drill mode (hear a syllable, pick the tone)
- Handwriting recognition grading
- Cloud sync of progress between web and mobile
- Android Glance / iOS interactive widgets with "reveal answer" buttons
