# iOS home-screen widget — "Character of the Day"

A native WidgetKit widget (small + medium sizes) showing the daily character.
It computes the character as *day-of-year mod 155* — identical to the app and
the Android widget — so nothing needs to be synced between app and widget.

Building iOS apps requires a Mac with Xcode (or EAS Build in the cloud).

## Setup (one time)

1. **Generate the native iOS project:**

   ```bash
   cd mobile-app
   npx expo prebuild --platform ios
   open ios/汉字Trainer.xcworkspace
   ```

2. **Add a Widget Extension target in Xcode:**
   - File → New → Target… → **Widget Extension**
   - Product name: `HanziWidget`
   - Uncheck "Include Configuration App Intent" (we use a static widget)
   - Activate the new scheme when prompted.

3. **Replace the generated widget code:**
   - Delete the template Swift file(s) Xcode created inside the `HanziWidget`
     group.
   - Drag `widgets/ios/HanziWidget.swift` and `widgets/ios/CharacterData.swift`
     into the `HanziWidget` group (check "Copy items if needed" and make sure
     the **HanziWidget target** is selected as the membership).

4. **Run it:** select the `HanziWidget` scheme → run on a simulator or device.
   Then long-press the home screen → **+** → search "汉字 Trainer" → add the
   widget. It updates at midnight every day.

## Notes

- The widget uses `containerBackground(for: .widget)`, which requires
  iOS 17+. For iOS 16 support, replace it with a plain `.background(...)`.
- `npx expo prebuild --clean` wipes the `ios/` folder including the widget
  target — you'd need to redo steps 2–3. Prefer plain `prebuild` without
  `--clean`, or look at the `@bacons/apple-targets` config plugin to make the
  widget target survive regeneration.
