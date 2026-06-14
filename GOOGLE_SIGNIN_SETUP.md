# Google Sign-In Setup for FENA

FENA uses **Google OAuth 2.0** with `expo-auth-session`. The mobile app obtains a Google **ID token** and sends it to the backend at `POST /api/auth/google`, which verifies the token and creates or links the user account.

You need OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/) — **not** Firebase Authentication.

---

## Important: you are using a dev client

Your app runs with `npx expo start --dev-client` (a **development build**), not Expo Go.

**Do not use** `https://auth.expo.io/...` — that proxy is deprecated and Google often rejects it. Native dev builds use **platform OAuth clients** (Android / iOS), not Expo's auth proxy.

---

## 1. Create or select a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).

---

## 2. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External**.
3. Fill in app name (**FENA**), support email, and developer contact.
4. Scopes: `openid`, `email`, `profile`.
5. Add **test users** while the app is in Testing mode.
6. Submit for verification before public launch.

---

## 3. Create OAuth client IDs

Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.

You need **three** clients for dev/production builds:

### A. Web client (required — used for token verification)

| Field | Value |
|-------|-------|
| Application type | **Web application** |
| Name | `FENA Web` |

**Authorized redirect URIs:** leave empty or add only if you also test on web.  
Native Android/iOS dev builds do **not** use `auth.expo.io` or `fena://` here.

Copy the **Client ID** →

- Mobile `.env` → `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- Backend `.env` → `GOOGLE_CLIENT_ID`

Both must be the **same Web client ID**.

### B. Android client (required for Android dev builds)

| Field | Value |
|-------|-------|
| Application type | **Android** |
| Package name | `com.fena.app` |
| SHA-1 fingerprint | see below |

**Get SHA-1 on Windows (debug keystore):**

`keytool` is not on PATH by default. Use the full path to your JDK:

```powershell
& "C:\Program Files\Java\jdk-17\bin\keytool.exe" -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

If that path does not exist, try Android Studio's bundled JDK:

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA1:** line from the output (e.g. `CB:45:3E:42:...`) and paste it into the Android OAuth client.

**Alternative (Gradle):** from the `vibespot/android` folder:

```powershell
.\gradlew signingReport
```

Look for `Variant: debug` → `SHA1` under `Config: debug`.

For EAS/production builds, also add SHA-1 from:

```bash
eas credentials -p android
```

Copy the **Client ID** → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` in mobile `.env`.

> Android OAuth clients do **not** use redirect URIs — Google matches your package name + SHA-1 instead.

**Required: enable custom URI scheme**

1. Open your **Android** OAuth client in Google Cloud Console.
2. Click **Advanced settings** (or edit the client).
3. Check **Enable custom URI scheme**.
4. Save. Changes can take a few minutes to apply.

Without this, Google returns: `Error 400: custom URI scheme is not enabled for your Android client`.

The app uses this redirect format (derived from your Android client ID):

```
com.googleusercontent.apps.<YOUR_ANDROID_CLIENT_PREFIX>:/oauth2redirect
```

Example for client `920018732298-abc...apps.googleusercontent.com`:

```
com.googleusercontent.apps.920018732298-abc...:/oauth2redirect
```

After changing the Android client ID or manifest, **rebuild** the dev client (Metro reload is not enough):

```powershell
cd vibespot
npx expo run:android
```

Then start Metro again: `npx expo start --dev-client --clear`.

When you tap **Continue with Google**, check Metro logs for:

```
GoogleAuth.redirectUri  com.googleusercontent.apps.920018732298-...:/oauthredirect
```

If you see `com.fena.app:/oauthredirect` or `exp+fena://` instead, the fix did not load — rebuild the app.

### C. iOS client (required for iOS dev builds)

| Field | Value |
|-------|-------|
| Application type | **iOS** |
| Bundle ID | `com.fena.app` |

Copy the **Client ID** → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in mobile `.env`.

---

## 4. Configure environment variables

### Mobile app (`vibespot/.env`)

```env
EXPO_PUBLIC_API_URL=https://your-api.example.com/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-android.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-ios.apps.googleusercontent.com
```

Restart Expo after changing `.env`:

```bash
npx expo start --dev-client --clear
```

### Backend (`vibesport_api/backend/.env`)

```env
GOOGLE_CLIENT_ID=123456789-web.apps.googleusercontent.com
```

Use the **Web** client ID (same as `EXPO_PUBLIC_GOOGLE_CLIENT_ID`).

---

## 5. Verify it works

1. Start the backend API.
2. Start the app: `npx expo start --dev-client`.
3. Open **Sign in** → tap **Continue with Google**.
4. Pick a Google account (must be a test user if consent screen is in Testing mode).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `androidClientId must be defined` | Create an **Android** OAuth client and set `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`. |
| `Error 400: custom URI scheme is not enabled` | Open Android OAuth client → **Advanced settings** → enable **Custom URI scheme**. Rebuild app with `npx expo run:android`. |
| `redirect_uri_mismatch` on Android | Rebuild the dev client after manifest changes. Ensure Android client ID in `.env` matches the one with custom URI scheme enabled. |
| Google Console says redirect URI is invalid | `https://auth.expo.io/nati_2098/fena` is wrong **and** deprecated. For dev builds, skip Web redirect URIs entirely and use the Android client. |
| `DEVELOPER_ERROR` on Android | Wrong SHA-1 on the Android OAuth client. Re-run `keytool` and update SHA-1 in Google Console. |
| `Google token audience mismatch` (backend) | Backend `GOOGLE_CLIENT_ID` must match mobile `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (Web client). |
| `access blocked` / consent screen | Add your Google account as a **test user** while consent screen is in Testing mode. |

### About `auth.expo.io` (legacy — do not use)

If you ever see docs mentioning:

```
https://auth.expo.io/@nati_2098/fena
```

Note the **`@`** before the username. Even with the correct format, this only applied to old Expo Go flows. **FENA uses dev builds** — use Android/iOS OAuth clients instead.

---

## Security notes for production

- Never commit `.env` files.
- Restrict OAuth credentials (Android package + SHA-1, iOS bundle ID).
- Move OAuth consent screen to **Production** before public launch.
- Keep `GOOGLE_CLIENT_ID` on the backend for ID token audience verification.
