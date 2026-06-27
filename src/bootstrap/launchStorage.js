import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
  refreshToken: 'refreshToken',
  onboarded: 'fena.onboarded',
};

let cache = null;

/**
 * Single cold-start read for auth + onboarding flags.
 * Shared by AuthContext and useFirstLaunch.
 */
export async function readLaunchStorage() {
  if (cache) return cache;

  const pairs = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
  const map = Object.fromEntries(pairs);

  cache = {
    token: map[STORAGE_KEYS.token] ?? null,
    refreshToken: map[STORAGE_KEYS.refreshToken] ?? null,
    userRaw: map[STORAGE_KEYS.user] ?? null,
    onboarded: map[STORAGE_KEYS.onboarded] === '1',
  };

  return cache;
}

export function patchLaunchStorageCache(patch) {
  if (!cache) return;
  cache = { ...cache, ...patch };
}

export function invalidateLaunchStorageCache() {
  cache = null;
}
