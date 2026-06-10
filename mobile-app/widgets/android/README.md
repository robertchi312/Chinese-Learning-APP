# Android home-screen widget — "Character of the Day"

A native Android widget that shows the daily character (same one the app and
the iOS widget show — all three compute it as *day-of-year mod 155*, so they
always agree without needing any data syncing).

Expo manages the `android/` folder for you, so the widget files live here in
`widgets/android/` and get copied in after you generate the native project.

## Setup (one time)

1. **Generate the native Android project:**

   ```bash
   cd mobile-app
   npx expo prebuild --platform android
   ```

2. **Copy the widget files into the generated project:**

   ```bash
   # Kotlin provider
   cp widgets/android/HanziWidgetProvider.kt android/app/src/main/java/com/hanzitrainer/app/

   # Layout, drawable and widget metadata
   mkdir -p android/app/src/main/res/layout android/app/src/main/res/drawable android/app/src/main/res/xml
   cp widgets/android/res/layout/widget_hanzi.xml android/app/src/main/res/layout/
   cp widgets/android/res/drawable/widget_background.xml android/app/src/main/res/drawable/
   cp widgets/android/res/xml/widget_hanzi_info.xml android/app/src/main/res/xml/

   # Character data the widget reads
   mkdir -p android/app/src/main/assets
   cp widgets/android/assets/characters.json android/app/src/main/assets/
   ```

3. **Register the widget** in `android/app/src/main/AndroidManifest.xml`,
   inside the `<application>` tag:

   ```xml
   <receiver
       android:name=".HanziWidgetProvider"
       android:exported="true">
       <intent-filter>
           <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
       </intent-filter>
       <meta-data
           android:name="android.appwidget.provider"
           android:resource="@xml/widget_hanzi_info" />
   </receiver>
   ```

4. **Add the widget description string** to
   `android/app/src/main/res/values/strings.xml`:

   ```xml
   <string name="widget_description">Learn one new Chinese character every day.</string>
   ```

5. **Build and run on a device/emulator:**

   ```bash
   npx expo run:android
   ```

6. On your phone: long-press the home screen → **Widgets** → **汉字 Trainer**
   → drag "Character of the Day" onto your home screen. It refreshes once a
   day automatically and opens the app when tapped.

> ⚠️ Note: `npx expo prebuild --clean` regenerates the `android/` folder and
> removes manual changes — re-run steps 2–4 afterwards (or script them).
