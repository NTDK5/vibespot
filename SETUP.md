# VibeSpot Setup Guide

## Quick Start Checklist

### 1. Firebase Project Setup
- [ ] Create Firebase project
- [ ] Enable Authentication (Email/Password + Google)
- [ ] Create Firestore database
- [ ] Enable Storage
- [ ] Copy Firebase config to `src/firebase/config.js`

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Firebase
- [ ] Update `src/firebase/config.js` with your Firebase config
- [ ] Update Google OAuth client IDs in `src/services/auth.js` (if using Google Sign-In)

### 4. Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```
- [ ] Update Cloud Function URLs in:
  - `src/services/auth.js`
  - `src/services/reviews.js`

### 5. Security Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 6. Create Admin User
- [ ] Register a user through the app
- [ ] In Firestore Console, update user document: `role: "admin"`

### 7. Run App
```bash
npm start
```

## Google Sign-In Setup (Optional)

For Google Sign-In to work, you need to:

1. **Enable Google Sign-In in Firebase Console**
   - Go to Authentication > Sign-in method
   - Enable Google
   - Copy the Web client ID

2. **Update `src/services/auth.js`**
   - Implement Google Sign-In using `expo-auth-session`
   - See the TODO comments in the file for implementation details

3. **Alternative: Use Web-based OAuth**
   - Implement a web-based OAuth flow
   - Or use `@react-native-google-signin/google-signin` for bare React Native

## Map Configuration

For maps to work properly:

1. **Get Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps SDK for Android and iOS
   - Create API key

2. **Update `app.json`**
   ```json
   {
     "expo": {
       "android": {
         "config": {
           "googleMaps": {
             "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
           }
         }
       },
       "ios": {
         "config": {
           "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
         }
       }
     }
   }
   ```

## Troubleshooting

### "Firebase config not found"
- Make sure you've updated `src/firebase/config.js` with your Firebase credentials

### "Permission denied" errors
- Check Firestore and Storage security rules
- Make sure user is authenticated
- Verify user role in Firestore

### Google Sign-In not working
- Check OAuth client IDs
- Verify Google Sign-In is enabled in Firebase Console
- See Google Sign-In setup section above

### Maps not loading
- Add Google Maps API key to `app.json`
- Enable Maps SDK in Google Cloud Console

### Cloud Functions errors
- Verify functions are deployed: `firebase functions:list`
- Check function URLs are correct
- View logs: `firebase functions:log`

## Next Steps After Setup

1. Test authentication flow
2. Create an admin user
3. Add your first spot
4. Test reviews functionality
5. Verify map functionality

## Production Checklist

- [ ] Update all spotholder values (API keys, client IDs, etc.)
- [ ] Configure proper security rules
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure app icons and splash screens
- [ ] Test on both iOS and Android
- [ ] Set up CI/CD pipeline
- [ ] Configure analytics
- [ ] Set up crash reporting

