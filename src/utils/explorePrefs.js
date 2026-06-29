/**
 * explorePrefs — lightweight persistence for the Explore screen.
 *
 * Two concerns, one tiny module:
 *   1. Recent text searches (so the search box can offer one-tap recall).
 *   2. The user's last-used discovery state (moods, sort, view) so the
 *      screen reopens where they left off.
 *
 * Everything is best-effort: AsyncStorage failures are swallowed and
 * sensible defaults returned, since none of this is critical-path data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

const RECENT_KEY = 'explore:recentSearches';
const PREFS_KEY = 'explore:prefs';
const MAX_RECENT = 8;

export async function getRecentSearches() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch (err) {
    logger.error({ service: 'explorePrefs', action: 'get_recent_error', message: err?.message });
    return [];
  }
}

export async function addRecentSearch(term) {
  const clean = String(term || '').trim();
  if (clean.length < 2) return getRecentSearches();
  try {
    const existing = await getRecentSearches();
    const deduped = [clean, ...existing.filter((s) => s.toLowerCase() !== clean.toLowerCase())];
    const next = deduped.slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch (err) {
    logger.error({ service: 'explorePrefs', action: 'add_recent_error', message: err?.message });
    return getRecentSearches();
  }
}

export async function clearRecentSearches() {
  try {
    await AsyncStorage.removeItem(RECENT_KEY);
  } catch (err) {
    logger.error({ service: 'explorePrefs', action: 'clear_recent_error', message: err?.message });
  }
  return [];
}

export async function getExplorePrefs() {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      moods: Array.isArray(parsed.moods) ? parsed.moods.filter((m) => typeof m === 'string') : [],
      sortMode: typeof parsed.sortMode === 'string' ? parsed.sortMode : undefined,
      viewMode: parsed.viewMode === 1 ? 1 : 0,
    };
  } catch (err) {
    logger.error({ service: 'explorePrefs', action: 'get_prefs_error', message: err?.message });
    return null;
  }
}

export async function saveExplorePrefs(prefs = {}) {
  try {
    await AsyncStorage.setItem(
      PREFS_KEY,
      JSON.stringify({
        moods: Array.isArray(prefs.moods) ? prefs.moods : [],
        sortMode: prefs.sortMode,
        viewMode: prefs.viewMode === 1 ? 1 : 0,
      }),
    );
  } catch (err) {
    logger.error({ service: 'explorePrefs', action: 'save_prefs_error', message: err?.message });
  }
}
