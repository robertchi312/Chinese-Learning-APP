# 汉字 Trainer — Learn Chinese Characters

Two complete apps for learning Chinese characters, sharing one dataset of
**155 HSK-1 level characters** (with pinyin, meanings, and example words):

| Option | Folder | What it is | Best for |
|---|---|---|---|
| 🌐 **Web app (PWA)** | [`web-app/`](web-app/) | Zero-install, works in any browser, installable to your home screen, fully offline | Start learning **right now** |
| 📱 **Mobile app** | [`mobile-app/`](mobile-app/) | Expo / React Native — builds into a **real iOS & Android app** with **native home-screen widgets** | The "real app" experience |
| 📦 **Shared data** | [`shared/`](shared/) | The character dataset both apps are generated from | Adding more characters |

Both apps have the same features, so you can switch between them and the
learning approach stays consistent:

- 🎴 **Flashcards with spaced repetition** — cards you find hard come back
  sooner; cards you know well come back in days, then weeks (simplified SM-2)
- ❓ **Quizzes** — character → meaning, character → pinyin, meaning → character
- ✍️ **Stroke practice** — trace strokes in the correct order (Hanzi Writer)
- 📚 **Browse & search** all 155 characters with your progress shown per character
- 🗓️ **Character of the day** + 🔥 daily streak tracking
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

Edit `shared/characters.json`, then regenerate the per-app data files
(`web-app/js/data.js`, `mobile-app/src/data/characters.ts`,
`mobile-app/widgets/ios/CharacterData.swift`,
`mobile-app/widgets/android/assets/characters.json`) — each file notes that it
is generated. A future improvement is a small build script that does this
automatically.

## Roadmap ideas

- HSK 2–6 character packs
- Tone-drill mode (hear a syllable, pick the tone)
- Handwriting recognition grading
- Cloud sync of progress between web and mobile
- Android Glance / iOS interactive widgets with "reveal answer" buttons
