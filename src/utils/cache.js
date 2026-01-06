import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_EXPIRY_PREFIX = 'cache_expiry_';

/**
 * Cache utility for storing and retrieving cached data
 * Supports time-based expiration
 */
export const Cache = {
  /**
   * Store data in cache with optional expiration time
   * @param {string} key - Cache key
   * @param {any} data - Data to cache (will be JSON stringified)
   * @param {number} expiryMinutes - Expiration time in minutes (default: 60)
   */
  async set(key, data, expiryMinutes = 60) {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      const expiryTime = Date.now() + expiryMinutes * 60 * 1000;

      await AsyncStorage.multiSet([
        [cacheKey, JSON.stringify(data)],
        [expiryKey, expiryTime.toString()],
      ]);
    } catch (error) {
      console.error('Error caching data:', error);
    }
  },

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached data or null if not found/expired
   */
  async get(key) {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;

      const [cachedData, expiryTime] = await AsyncStorage.multiGet([
        cacheKey,
        expiryKey,
      ]);

      if (!cachedData[1] || !expiryTime[1]) {
        return null;
      }

      // Check if expired
      if (Date.now() > parseInt(expiryTime[1], 10)) {
        // Remove expired cache
        await this.remove(key);
        return null;
      }

      return JSON.parse(cachedData[1]);
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  },

  /**
   * Remove specific cache entry
   * @param {string} key - Cache key
   */
  async remove(key) {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      await AsyncStorage.multiRemove([cacheKey, expiryKey]);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  },

  /**
   * Clear all cached data
   */
  async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        (key) => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  /**
   * Check if cache exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  async has(key) {
    const data = await this.get(key);
    return data !== null;
  },

  /**
   * Remove expired cache entries
   */
  async cleanup() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const expiryKeys = keys.filter((key) => key.startsWith(CACHE_EXPIRY_PREFIX));

      for (const expiryKey of expiryKeys) {
        const expiryTime = await AsyncStorage.getItem(expiryKey);
        if (expiryTime && Date.now() > parseInt(expiryTime, 10)) {
          // Extract the cache key from expiry key
          const cacheKey = expiryKey.replace(CACHE_EXPIRY_PREFIX, '');
          await this.remove(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  },
};
