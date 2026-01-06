# Google Maps API Key Setup

## Issue
The app crashes when trying to edit spot location in production builds because `react-native-maps` requires a Google Maps API key for Android.

## Solution

### Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS** (if building for iOS)
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **API Key**
6. Copy your API key

### Step 2: Configure the API Key in app.json

Open `app.json` and replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ACTUAL_API_KEY_HERE"
    }
  }
}
```

### Step 3: Restrict Your API Key (Recommended for Production)

For security, restrict your API key:

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **API restrictions**, select **Restrict key**
4. Choose:
   - **Maps SDK for Android**
   - **Maps SDK for iOS** (if needed)
5. Under **Application restrictions**, select **Android apps** and add:
   - Package name: `com.vibespot.app`
   - SHA-1 certificate fingerprint: (get this from your keystore)

### Step 4: Rebuild the App

After adding the API key, you need to rebuild the app:

```bash
# For preview build (APK)
eas build --platform android --profile preview

# For production build
eas build --platform android --profile production
```

**Note:** The API key must be set before building. It cannot be changed in an existing build.

## Error Handling

The app now includes error handling for map loading failures. If the API key is missing or invalid, users will see a friendly error message instead of the app crashing.

## Testing

After rebuilding, test the location editing feature:
1. Open a spot detail screen
2. Click the edit button (superadmin only)
3. Click on the location coordinates button
4. The map should load without crashing
