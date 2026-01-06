# Authentication & Caching Implementation

## ✅ Completed Features

### 1. Persistent Login
- **Auto-login on app start**: The app now checks for stored authentication tokens when it launches
- **Token validation**: Validates stored tokens by fetching current user data
- **Automatic session restoration**: Restores user session from AsyncStorage if token is valid
- **User data persistence**: User data is stored in AsyncStorage and restored on app restart

### 2. Proper Logout
- **Complete logout**: Clears all authentication data (token, refreshToken, user)
- **Backend notification**: Notifies backend to invalidate refresh tokens
- **Automatic redirect**: Automatically redirects to login screen after logout
- **Clean state**: Ensures no cached auth data remains after logout

### 3. Caching System
- **React Query Persistence**: All API queries are automatically cached and persisted using AsyncStorage
- **Time-based expiration**: Cache entries expire after 24 hours
- **Offline support**: Cached data is available even when offline
- **Custom cache utility**: Additional cache utility for manual caching needs

## 📦 Installation

Install the required dependencies:

```bash
npm install @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
```

Or with Expo:

```bash
npx expo install @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
```

## 🔧 How It Works

### Authentication Flow

1. **App Startup**:
   - Checks AsyncStorage for existing token
   - If found, validates token by fetching user data
   - Restores user session if token is valid
   - Redirects to login if no valid token

2. **Login**:
   - Stores access token, refresh token, and user data in AsyncStorage
   - Updates auth context state
   - Automatically navigates to main app

3. **Logout**:
   - Calls backend logout endpoint
   - Clears all auth data from AsyncStorage
   - Resets auth context state
   - Automatically navigates to login screen

### Caching Flow

1. **React Query Persistence**:
   - All queries are automatically cached
   - Cache is persisted to AsyncStorage
   - Cache persists across app restarts
   - Cache expires after 24 hours

2. **Custom Cache Utility**:
   - Located in `src/utils/cache.js`
   - Supports time-based expiration
   - Can be used for manual caching needs

## 📝 Usage Examples

### Using Custom Cache Utility

```javascript
import { Cache } from '../utils/cache';

// Store data with 60 minute expiration
await Cache.set('myKey', myData, 60);

// Get cached data
const cachedData = await Cache.get('myKey');

// Check if cache exists
const exists = await Cache.has('myKey');

// Remove specific cache
await Cache.remove('myKey');

// Clear all cache
await Cache.clear();

// Cleanup expired entries
await Cache.cleanup();
```

### Accessing Auth Context

```javascript
import { useAuth } from '../hooks/useAuth';

const { user, login, logout, loading, isSuperAdmin } = useAuth();

// Login
const result = await login(email, password);
if (result.error) {
  console.error(result.error);
}

// Logout
const result = await logout();
if (result.error) {
  console.error(result.error);
}
```

## 🔐 Token Refresh

The axios interceptor automatically handles token refresh:

- On 401 errors, attempts to refresh the token
- Uses stored refresh token to get new access token
- Retries the original request with new token
- Clears auth if refresh fails

## 🎯 Benefits

1. **Better UX**: Users don't need to login every time
2. **Offline Support**: Cached data available offline
3. **Faster Load Times**: Cached data loads instantly
4. **Reduced API Calls**: Less server load with smart caching
5. **Security**: Proper token management and cleanup

## 🐛 Troubleshooting

### User has to login every time
- Check if AsyncStorage is working
- Verify token is being stored correctly
- Check console for token validation errors

### Logout not working
- Check if logout function is called from context
- Verify AsyncStorage cleanup is working
- Check backend logout endpoint

### Cache not persisting
- Verify AsyncStorage permissions
- Check cache expiration settings
- Verify react-query persistence is configured

## 🔄 Next Steps

After installation, the features will work automatically:

1. **Login** once and your session will persist
2. **Logout** properly clears everything and redirects to login
3. **Cache** works automatically for all react-query hooks
4. **Token refresh** happens automatically when needed

No additional configuration needed! 🎉
