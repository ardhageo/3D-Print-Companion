# PrintCost Android packaging

This project is the Google AI Studio PrintCost web app prepared for Android packaging with Capacitor 8.

## What was changed

- Added Capacitor 8 Android runtime configuration.
- Package ID: `com.ardha.printcost`
- Android app name: `PrintCost`
- Android target/compile SDK comes from Capacitor 8 (API 36), matching the current Google Play requirement for new apps and updates.
- Added native Android file sharing with `@capacitor/share`.
- Added native file storage with `@capacitor/filesystem`.
- On Android, Export Download saves to `Documents/PrintCost`.
- On Android, Share creates a temporary file in the app cache and invokes the native Android share sheet.
- Browser behavior remains available as a fallback.
- Capacitor builds skip the PWA service worker because service workers can interfere with Capacitor plugin injection.
- Removed the unused `@google/genai`, Express and dotenv dependencies from the Android-ready package.

## Build prerequisites

- Node.js 22+
- Android Studio Otter (2025.2.1)+
- Android SDK API 36

## First setup

```bash
npm install
npm run cap:add
npm run cap:icons
npm run cap:sync
npm run cap:open
```

If `android/` already exists, skip `npm run cap:add`.

## Build an APK for phone testing

```bash
npm run cap:build:apk
```

## Build an AAB for Google Play

```bash
npm run cap:build:aab
```

For Google Play, use a release signing key/keystore and keep that key safe. Do not commit passwords or signing keys into the project.

## Updating the web app later

After changing React/TypeScript code:

```bash
npm run cap:sync
```

Then rebuild the APK/AAB.
