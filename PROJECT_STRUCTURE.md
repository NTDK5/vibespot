# VibeSpot Project Structure

## Complete File Tree

```
vibespot/
├── App.js                          # Main app entry point
├── app.json                        # Expo configuration
├── babel.config.js                 # Babel configuration
├── package.json                    # Dependencies
├── .gitignore                     # Git ignore rules
├── .firebaserc                     # Firebase project config
├── firebase.json                   # Firebase configuration
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Firestore indexes
├── storage.rules                   # Storage security rules
├── README.md                       # Main documentation
├── SETUP.md                        # Setup instructions
│
├── functions/                      # Cloud Functions
│   ├── index.js                   # Cloud Functions code
│   └── package.json               # Functions dependencies
│
└── src/
    ├── components/                # Reusable UI components
    │   ├── Button.js              # Button component
    │   ├── SpotCard.js           # Spot card for lists
    │   ├── ReviewCard.js          # Review card component
    │   └── ImageUploader.js       # Image picker/uploader
    │
    ├── screens/                   # App screens
    │   ├── LoginScreen.js         # Login screen
    │   ├── RegisterScreen.js      # Registration screen
    │   ├── HomeScreen.js          # Home/feed screen
    │   ├── ExploreScreen.js      # Browse/search screen
    │   ├── MapScreen.js           # Map view screen
    │   ├── SpotDetailScreen.js   # Spot details & reviews
    │   ├── AddSpotScreen.js      # Add spot (admin only)
    │   └── ProfileScreen.js       # User profile
    │
    ├── services/                  # Firebase services
    │   ├── auth.js                # Authentication service
    │   ├── spots.js              # Spots CRUD operations
    │   ├── reviews.js             # Reviews CRUD operations
    │   └── upload.js              # Image upload service
    │
    ├── hooks/                     # Custom React hooks
    │   ├── useAuth.js             # Authentication hook
    │   └── useLocation.js         # Location hook
    │
    ├── navigation/                # Navigation setup
    │   └── AppNavigator.js        # Main navigator
    │
    ├── firebase/                  # Firebase configuration
    │   └── config.js              # Firebase init & config
    │
    └── utils/                     # Utility functions
        ├── constants.js           # App constants
        └── helpers.js             # Helper functions
```

## Key Features by File

### Authentication
- **src/services/auth.js**: Email/password & Google Sign-In
- **src/hooks/useAuth.js**: Auth state management
- **src/screens/LoginScreen.js**: Login UI
- **src/screens/RegisterScreen.js**: Registration UI

### Spots Management
- **src/services/spots.js**: CRUD operations for spots
- **src/screens/AddSpotScreen.js**: Admin add spot form
- **src/components/SpotCard.js**: Spot display component

### Reviews System
- **src/services/reviews.js**: Review CRUD operations
- **src/components/ReviewCard.js**: Review display component
- **functions/index.js**: Rating recalculation function

### Navigation
- **src/navigation/AppNavigator.js**: Role-based navigation
- Tab navigation for main app
- Stack navigation for auth flow

### Firebase Integration
- **src/firebase/config.js**: Firebase initialization
- **firestore.rules**: Security rules
- **storage.rules**: Storage security rules
- **functions/index.js**: Cloud Functions

## Data Flow

1. **Authentication Flow**
   - User signs in → Auth service → Firestore user doc → Custom claims
   - Role checked via useAuth hook → Navigation updates

2. **Spots Flow**
   - Admin adds spot → Upload images → Save to Firestore
   - Users browse → Query Firestore → Display on list/map

3. **Reviews Flow**
   - User adds review → Save to Firestore → Trigger Cloud Function
   - Cloud Function recalculates rating → Updates spot document

## Security

- **Firestore Rules**: Role-based access control
- **Storage Rules**: Admin-only spot uploads, user review uploads
- **Custom Claims**: Admin role verification

## Cloud Functions

1. **setUserRole**: Sets custom claims from Firestore role
2. **recalculateRating**: Updates spot rating when reviews change

## Next Steps

1. Configure Firebase credentials
2. Deploy Cloud Functions
3. Set up Google Sign-In (optional)
4. Configure Google Maps API
5. Test all features
6. Create admin user

