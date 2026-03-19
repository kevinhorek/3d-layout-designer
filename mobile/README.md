# 3D Layout Designer (Expo)

React Native app for iOS, Android, and **web**.

## Run

```bash
npm install
npm start          # Expo dev tools — press w for web, i for iOS, a for Android
npm run web        # Start with web only (Metro + browser)
npm run ios
npm run android
```

Web dev URL is usually **http://localhost:8081** (check the terminal).

## Web vs native 3D

- **iOS / Android:** `Scene3D.native.tsx` — `@react-three/fiber/native` + expo-gl.
- **Web:** `Scene3D.web.tsx` — `@react-three/fiber` + browser WebGL.

Shared scene graph lives in `src/components/Scene3DShared.tsx`.

## Static export

```bash
npx expo export --platform web
```

Output: `dist/` (served as static files).
