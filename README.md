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

Core features (the web app additionally has the full "Ink & Paper" design and
the adaptive engine — the mobile app gets them in a follow-up pass):

- ✨ **Smart sessions (web)** — an adaptive engine tracks your accuracy across
  five skills (recognizing, pronouncing, listening, recalling, writing) and
  automatically mixes practice toward your weak spots
- 🧠 **"How you learn" insights (web)** — your skill profile with
  plain-English notes on the science (spaced repetition, retrieval practice,
  interleaving, dual coding)
- 🎴 **Flashcards with spaced repetition** — cards you find hard come back
  sooner; cards you know well come back in days, then weeks (simplified SM-2)
- 💭 **Memory stories & component breakdowns** for every character
  (好 = 女 woman + 子 child: "A woman with her child — what could be more good?")
- ❓ **Quizzes** — char → meaning, char → pinyin, 🔊 audio → char (web),
  meaning → char
- ✍️ **Stroke practice** — trace strokes in the correct order (Hanzi Writer)
- 📚 **Browse & search** all 155 characters with your progress per character
- 🗓️ **Character of the day**, 🔥 streaks, 🎯 daily goal ring (web)
- 🐼 A supportive panda mascot, confetti on milestones, and a "night ink"
  dark mode (web)
- 🔊 **Pronunciation audio** (text-to-speech)
- 🏠 **Home-screen widget**: native Android & iOS widgets in the mobile app
  showing the character of the day (the PWA shows the same daily character on
  its Today tab)

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
