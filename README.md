# VibeSpot - React Native (Expo) + Firebase

A mobile app for discovering and reviewing amazing spots around you.

## Features

- 🔐 **Authentication**: Email/password and Google Sign-In
- 👥 **Role-based Access**: Admin and User roles
- 📍 **Spots Management**: Admins can add spots with images, location, and details
- 🗺️ **Map View**: Browse spots on an interactive map
- ⭐ **Reviews System**: Users can leave ratings and reviews
- 📸 **Image Upload**: Multiple image support for spots and reviews
- 🔄 **Offline Support**: Firestore local caching enabled

## Project Structure

```
vibespot/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.js
│   │   ├── SpotCard.js
│   │   ├── ReviewCard.js
│   │   └── ImageUploader.js
│   ├── screens/             # App screens
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ExploreScreen.js
│   │   ├── MapScreen.js
│   │   ├── SpotDetailScreen.js
│   │   ├── AddSpotScreen.js
│   │   └── ProfileScreen.js
│   ├── services/            # Firebase services
│   │   ├── auth.js
│   │   ├── spots.js
│   │   ├── reviews.js
│   │   └── upload.js
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useLocation.js
│   ├── navigation/          # Navigation setup
│   │   └── AppNavigator.js
│   ├── firebase/            # Firebase configuration
│   │   └── config.js
│   └── utils/               # Utility functions
│       ├── constants.js
│       └── helpers.js
├── functions/               # Cloud Functions
│   ├── index.js
│   └── package.json
├── firestore.rules          # Firestore security rules
├── storage.rules            # Storage security rules
├── App.js                  # App entry point
├── app.json                # Expo configuration
└── package.json            # Dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google Sign-In
3. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
4. Enable Storage:
   - Go to Storage
   - Create storage bucket
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Copy the config object

### 3. Configure Firebase

Edit `src/firebase/config.js` and respot the spotholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Google Sign-In Setup

1. In Firebase Console > Authentication > Sign-in method > Google:
   - Enable Google Sign-In
   - Copy the Web client ID
2. Edit `src/services/auth.js`:
   - Respot `YOUR_IOS_CLIENT_ID` with your iOS OAuth client ID
   - Respot `YOUR_ANDROID_CLIENT_ID` with your Android OAuth client ID

### 5. Cloud Functions Setup

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase Functions:
   ```bash
   cd functions
   npm install
   ```

4. Deploy Cloud Functions:
   ```bash
   firebase deploy --only functions
   ```

5. Update Cloud Function URLs:
   - After deployment, copy the function URLs
   - Update URLs in `src/services/auth.js` and `src/services/reviews.js`

### 6. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 7. Create Admin User

1. Register a user through the app
2. In Firebase Console > Firestore Database:
   - Go to `users` collection
   - Find your user document
   - Update the `role` field to `"admin"`

### 8. Run the App

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code with Expo Go app on your device

## Key Features Implementation

### Authentication
- Email/password authentication
- Google Sign-In
- Role-based access control via Firestore + custom claims

### Spots Management
- Admins can add spots with:
  - Title, description, category
  - Price range
  - Location (lat/lng)
  - Tags
  - Main image + gallery images
- Spots stored in Firestore with GeoPoint for location

### Reviews System
- Users can add reviews with:
  - Rating (1-5 stars)
  - Text comment
  - Optional image
- Cloud Function automatically recalculates average rating

### Map Integration
- Google Maps integration via `react-native-maps`
- Display spots as markers
- Query nearby spots
- User location tracking

## Security Rules

### Firestore Rules
- Only admins can create/update/delete spots
- Authenticated users can read spots
- Users can only edit their own reviews
- Admins can delete any review

### Storage Rules
- Only admins can upload spot images
- Users can upload their own review images
- Authenticated users can read all images

## Cloud Functions

1. **setUserRole**: Sets custom claims based on Firestore user role
2. **recalculateRating**: Recalculates average rating when reviews change

## Notes

- Offline persistence is enabled for Firestore
- Image uploads use Firebase Storage
- Location services require permissions
- Map functionality requires Google Maps API key (configure in `app.json`)

## Troubleshooting

1. **Google Sign-In not working**: Check OAuth client IDs in `auth.js`
2. **Cloud Functions errors**: Verify function URLs are updated after deployment
3. **Map not loading**: Add Google Maps API key to `app.json`
4. **Permission errors**: Check Firestore and Storage security rules

## Next Steps

- Add user profile images
- Implement search with Algolia
- Add favorites/bookmarks
- Push notifications
- Social sharing
- Advanced filtering

## License

MIT

