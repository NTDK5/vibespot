import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

export const APPEARANCE_PREFS_KEY = 'fena.settings.appearance';

/** @typedef {'light' | 'dark' | 'system'} AppearancePreference */

/** @type {AppearancePreference} */
export const DEFAULT_APPEARANCE = 'system';

/** @param {unknown} value */
export function normalizeAppearancePreference(value) {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return DEFAULT_APPEARANCE;
}

export async function getAppearancePreference() {
  try {
    const raw = await AsyncStorage.getItem(APPEARANCE_PREFS_KEY);
    return normalizeAppearancePreference(raw);
  } catch (err) {
    logger.error({
      service: 'appearancePrefs',
      action: 'get_error',
      message: err?.message,
    });
    return DEFAULT_APPEARANCE;
  }
}

/** @param {AppearancePreference} preference */
export async function setAppearancePreference(preference) {
  const next = normalizeAppearancePreference(preference);
  try {
    await AsyncStorage.setItem(APPEARANCE_PREFS_KEY, next);
  } catch (err) {
    logger.error({
      service: 'appearancePrefs',
      action: 'set_error',
      message: err?.message,
    });
  }
  return next;
}
