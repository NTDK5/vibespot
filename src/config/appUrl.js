/** Public web origin for share links — no trailing slash. */
export const APP_WEB_URL = (
  process.env.EXPO_PUBLIC_APP_URL || 'https://fena.app'
).replace(/\/+$/, '');

export function buildSpotShareUrl(spotId) {
  if (!spotId) return null;
  return `${APP_WEB_URL}/s/${spotId}`;
}

export function buildCollectionShareUrl(collectionId) {
  if (!collectionId) return null;
  return `${APP_WEB_URL}/p/${collectionId}`;
}
