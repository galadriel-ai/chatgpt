# Welcome to Sidekik

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Prerequisites

- Xcode 16+
- iOS Emulator
  - `xcodebuild -downloadPlatform iOS`

## Get started

1. Install dependencies

```bash
cp template.env .env
npm install
```

2. Setup Xcode signing certificate
   First run this command under `client`

```bash
xed ios
```

And then follow this guide:
https://github.com/expo/fyi/blob/main/setup-xcode-signing.md

3. (Optional) Prebuild the project
   The expo prebuild generates native ios/android code in the corresponding folders. It's not necessary to prebuild the project unless you add/remove react native libs, or change settings in `app.json`

If you want to prebuild the project, run this command:

```bash
npm run prebuild
```

4. Build the project on the ios emulator

```bash
npm run ios
```

Run this command and you will see the app is loaded on the iPhone emulator.

5. Code style/linting

**Before PRs run these**

```bash
npm run format
npm run lint
```
