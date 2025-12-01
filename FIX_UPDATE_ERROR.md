# Fix: "Failed to download remote update" Error

## Quick Fix Steps

### 1. Remove Incompatible Packages

The error is caused by incompatible React Native Firebase packages. For Expo, we only need the web Firebase SDK.

Run these commands:

```bash
npm uninstall @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage
```

### 2. Clear Cache and Reinstall

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -r node_modules
# Or on Windows PowerShell:
Remove-Item -Recurse -Force node_modules

# Remove package-lock.json
rm package-lock.json
# Or on Windows:
Remove-Item package-lock.json

# Reinstall dependencies
npm install
```

### 3. Clear Expo Cache

```bash
# Clear Expo cache
npx expo start --clear

# Or if that doesn't work:
rm -r .expo
# Or on Windows:
Remove-Item -Recurse -Force .expo
```

### 4. Restart Development Server

```bash
# Start with cleared cache
npx expo start --clear

# Or use tunnel mode if network issues:
npx expo start --tunnel
```

## Alternative: Disable Updates (Already Done)

I've already updated `app.json` to disable Expo updates which should prevent this error. The changes include:

```json
"updates": {
  "enabled": false,
  "fallbackToCacheTimeout": 0
}
```

## If Error Persists

### Option 1: Use Tunnel Mode
```bash
npx expo start --tunnel
```

### Option 2: Check Network/Firewall
- Make sure your firewall isn't blocking Expo
- Try connecting to a different network
- Disable VPN if using one

### Option 3: Reset Everything
```bash
# Clear all caches
npm cache clean --force
rm -r node_modules .expo
rm package-lock.json

# Reinstall
npm install

# Start fresh
npx expo start --clear
```

## Verify Fix

After completing the steps:
1. The error should be gone
2. App should load normally
3. Firebase should work with web SDK (already configured)

## Note

The app is already configured to use the web Firebase SDK (`firebase` package), which is correct for Expo. The React Native Firebase packages were incorrectly included and need to be removed.

