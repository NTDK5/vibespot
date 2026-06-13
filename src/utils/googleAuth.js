/**
 * Google OAuth helpers for native redirect URIs.
 *
 * Android/iOS dev builds must use Google's reversed client ID scheme:
 *   com.googleusercontent.apps.<CLIENT_ID_PREFIX>:/oauth2redirect
 *
 * Also enable "Custom URI scheme" on the Android OAuth client in Google Cloud Console.
 */

/** @param {string | undefined} clientId */
export function googleClientIdPrefix(clientId) {
  const id = String(clientId || '').trim().replace(/^"|"$/g, '');
  if (!id.endsWith('.apps.googleusercontent.com')) return null;
  return id.replace('.apps.googleusercontent.com', '');
}

/** @param {string | undefined} clientId */
export function googleNativeRedirectUri(clientId) {
  const prefix = googleClientIdPrefix(clientId);
  if (!prefix) return null;
  return `com.googleusercontent.apps.${prefix}:/oauth2redirect`;
}

/** @param {string | undefined} clientId */
export function googleNativeScheme(clientId) {
  const prefix = googleClientIdPrefix(clientId);
  if (!prefix) return null;
  return `com.googleusercontent.apps.${prefix}`;
}
