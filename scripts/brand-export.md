# FENA brand PNG export

Expo requires raster assets for `app.json` icon and splash. In-app UI uses SVG via `react-native-svg` components in `src/components/brand/`.

## Regenerate PNGs

```bash
npm run brand:export
```

Uses **sharp** (`scripts/export-brand-pngs.mjs`) against:

- `assets/brand/logo-mark-alt.svg` → `assets/icon.png` (1024×1024, ink `#14161D` background)
- Same mark → `assets/adaptive-icon-foreground.png` (1024×1024)
- Mark + wordmark + two-line tagline → `assets/splash.png` (1284×2778, vertical column)
- Mark only → `assets/splash-android-icon.png` (1024×1024, ink background)
- Mark → `assets/favicon.png` (48×48)

Source SVGs copied from the design kit (`logo-lockup-alt.svg`, `logo-mark-alt.svg`).

After export, open `assets/splash.png` and confirm the full tagline is visible — no clipped “Discover” or “time”.

## Native splash: iOS vs Android

| Platform | Native splash | Full tagline |
|----------|---------------|--------------|
| **iOS** | Full portrait `splash.png` (mark + FENA + tagline) via `enableFullScreenImage_legacy` | Yes, on native flash |
| **Android 12+** | Centered logo mark only (`splash-android-icon.png`) on `#14161D` | No — Android uses a square icon splash; tagline appears on the JS `SplashScreen` (~1.2s) |

Android intentionally uses a mark-only drawable so the portrait composition is not crushed into a ~200dp square. The branded tagline moment is the in-app splash (`SplashScreen.js`).

## After changing splash assets

Regenerate native Android drawables:

```bash
npx expo prebuild --platform android --clean
```

For EAS preview builds:

```bash
npx eas build --platform android --profile preview --clear-cache
```

Do not hand-edit `android/app/src/main/res/drawable-*` — let prebuild generate `splashscreen_logo` from the plugin config.
