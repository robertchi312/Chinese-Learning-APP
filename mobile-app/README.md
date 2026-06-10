# 汉字 Trainer — Mobile App (Expo / React Native)

A real native mobile app for iOS and Android, with native home-screen widgets.

## Run it on your phone in ~2 minutes

```bash
cd mobile-app
npm install
npx expo start
```

Install the **Expo Go** app on your phone, scan the QR code, done. Hot reload
included.

> If dependency versions ever drift out of sync with the Expo SDK, run
> `npx expo install --fix`.

## Build a real installable app

The easiest path is [EAS Build](https://docs.expo.dev/build/introduction/)
(free tier available, builds in the cloud — no Mac needed for iOS):

```bash
npm install -g eas-cli
eas login                 # free expo.dev account
eas build:configure

# Android APK you can install directly on your phone:
eas build --platform android --profile preview

# App Store / Play Store builds:
eas build --platform ios
eas build --platform android
```

Or build locally with the generated native projects:

```bash
npx expo prebuild
npx expo run:android      # needs Android Studio
npx expo run:ios          # needs Xcode on a Mac
```

## Home-screen widgets 🏠

Native "Character of the Day" widgets for both platforms live in
[`widgets/`](widgets/):

- [`widgets/android/README.md`](widgets/android/README.md) — Kotlin
  `AppWidgetProvider`, refreshes daily, opens the app on tap
- [`widgets/ios/README.md`](widgets/ios/README.md) — SwiftUI WidgetKit widget,
  small + medium sizes

Both compute the daily character the same way the app does (day-of-year mod
155), so app and widget always agree without any data syncing. Widgets
require a real build (`expo prebuild` / EAS) — they can't run inside Expo Go.

## Structure

```
App.tsx                     # tab navigation + SRS state owner
src/data/characters.ts      # generated from ../shared/characters.json
src/srs.ts                  # spaced-repetition scheduler (AsyncStorage)
src/screens/HomeScreen.tsx        # character of the day + stats + streak
src/screens/FlashcardsScreen.tsx  # SRS flashcards (Again/Hard/Good/Easy)
src/screens/QuizScreen.tsx        # 3 multiple-choice quiz modes
src/screens/WriteScreen.tsx       # stroke practice (Hanzi Writer in a WebView)
src/screens/BrowseScreen.tsx      # searchable character list with progress
widgets/                    # native Android & iOS home-screen widgets
```
