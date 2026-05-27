# Technical ID migration: vibespot → fena

## Risk (store identity)

Changing `applicationId` / `bundleIdentifier` creates a **new app identity** in Google Play and Apple App Store.

- Existing installs keyed to `com.vibespot.app` will **not** auto-upgrade to `com.fena.app`.
- Treat this as a new listing or plan a migration (forced reinstall, data export, comms).

## Final identifiers (in repo)

| Setting | Value |
|--------|--------|
| `expo.name` | FENA |
| `expo.slug` | fena |
| `expo.scheme` | fena |
| iOS `bundleIdentifier` | com.fena.app |
| Android `package` / `applicationId` | com.fena.app |
| Deep link | `fena://` |
| Android dev client scheme | `exp+fena` |

## External console actions still required

### Firebase

- Register Android app with package `com.fena.app` → download new `google-services.json` → `android/app/`.
- Register iOS app with bundle `com.fena.app` → download new `GoogleService-Info.plist` → `ios/` (after `npx expo prebuild`).
- Update OAuth authorized redirect URIs if using Google Sign-In: `fena://` (and Expo dev redirect as needed).

### Google Cloud (Maps / OAuth)

- Maps API key restriction: package `com.fena.app` + SHA-1.
- OAuth client: add `fena://` redirect URIs for mobile.

### Google Play / App Store Connect

- Create or migrate listing under new package/bundle IDs.
- Upload new builds from EAS with updated IDs.

### Backend / Render

- Default API URL in app is `https://fena-backend.onrender.com/api` — deploy or set `EXPO_PUBLIC_API_URL` to your live API.

## iOS native project

This repo currently has **no committed `ios/` folder**. iOS bundle ID is set in `app.json`. Generate native project when needed:

```bash
npx expo prebuild --platform ios
```

Then verify `PRODUCT_BUNDLE_IDENTIFIER = com.fena.app` in the Xcode project.

## Regenerate Android after config changes

```bash
npx expo prebuild --platform android --clean
```

Or build with EAS: `eas build --platform android --profile preview`

## EAS project slug mismatch (build error)

Expo error:

```text
Slug for project identified by "extra.eas.projectId" (vibespot) does not match the "slug" field (fena).
```

**Cause:** An EAS `projectId` is permanently tied to the slug it was created with. The existing project `37f3f96d-ab6e-4b1c-8ab1-2d8898539937` is `@nati_2098/vibespot` and **cannot be renamed** to `fena`.

**Fix (create a new EAS project):**

1. Open [expo.dev](https://expo.dev) → account **nati_2098** → **Create project**.
2. Set project slug to **`fena`** (must match `app.json`).
3. Copy the new **Project ID** from project settings.
4. In `app.json`, set:

   ```json
   "extra": {
     "eas": {
       "projectId": "<NEW_PROJECT_ID>"
     }
   }
   ```

5. Link and verify:

   ```bash
   cd vibespot
   npx eas init --id <NEW_PROJECT_ID> --force
   npx eas project:info
   ```

6. Re-run build:

   ```bash
   npx eas build --platform android --profile preview
   ```

**Do not** run `eas init --force` without `--id` while the old `@nati_2098/vibespot` project exists — it will re-link the old ID and can revert `slug` to `vibespot`.

**Google OAuth:** After the new project exists, add redirect URI `fena://redirect` (or your `makeRedirectUri` output) in Google Cloud Console.

## EAS Android: "No variants exist" (Gradle)

If cloud build fails resolving `:react-native-*` with **No variants exist**:

1. Commit all Android changes (`com/fena/app`, removed `com/vibespot/app`).
2. `eas.json` now runs `expo prebuild --platform android --no-install --clean` on EAS (regenerates native project on Linux).
3. `.npmrc` sets `legacy-peer-deps=true` (production profile also sets the env var).
4. Rebuild with cache cleared:

   ```bash
   npx eas build --platform android --profile preview --clear-cache
   ```

Local `android/build/` with Windows paths is gitignored and must not be committed.
