/**
 * geo — small geographic helpers used by Discovery screens.
 *
 * The backend's /spot/nearby endpoint already enriches each spot with
 * `distance` (meters), `distanceKm`, and `approxTimeMin` (see
 * services/spots.service.js). These helpers exist for screens that
 * need a distance against an arbitrary spot list (Editor's Picks,
 * Trending, mood grid, etc.) where the server didn't pre-compute it.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function isNum(v) {
  return typeof v === 'number' && !Number.isNaN(v);
}

/**
 * Haversine distance between two lat/lng coordinates, in kilometers.
 * Returns `null` if any input is missing or non-numeric — callers can
 * then decide whether to omit the distance row or fall back to a
 * placeholder.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  if (![lat1, lng1, lat2, lng2].every(isNum)) return null;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Pull a `{ latitude, longitude }` or `{ lat, lng }` pair out of either
 * a spot record or a plain coordinates object. The backend has shipped
 * both shapes at different points, so the Discovery screens stay
 * tolerant.
 */
export function pickCoords(input) {
  if (!input || typeof input !== 'object') return null;
  const lat =
    input.latitude ??
    input.lat ??
    input.location?.latitude ??
    input.location?.lat ??
    input.coords?.latitude ??
    input.coords?.lat;
  const lng =
    input.longitude ??
    input.lng ??
    input.location?.longitude ??
    input.location?.lng ??
    input.coords?.longitude ??
    input.coords?.lng;
  if (!isNum(lat) || !isNum(lng)) return null;
  return { lat, lng };
}

/**
 * Convenience wrapper: distance in km from a user location object to a
 * spot's coordinates. Falls back to a backend-provided `distanceKm`
 * when present so the number stays consistent with the /nearby endpoint.
 */
export function distanceKmFromUser(user, spot) {
  if (isNum(spot?.distanceKm)) return spot.distanceKm;
  if (isNum(spot?.distance)) return spot.distance / 1000;
  const u = pickCoords(user);
  const s = pickCoords(spot);
  if (!u || !s) return null;
  return haversineKm(u.lat, u.lng, s.lat, s.lng);
}

export function kmToMiles(km) {
  if (!isNum(km)) return null;
  return km * 0.621371;
}

/**
 * Editorial distance label, e.g. "0.4 MI" or "2 MI". Tiles below
 * 0.1 mi snap to "0.1 MI" so the pill never reads "0.0 MI".
 */
export function formatMiles(km, digits = 1) {
  const mi = kmToMiles(km);
  if (mi == null) return null;
  if (mi < 0.1) return '0.1 MI';
  return `${mi.toFixed(digits)} MI`;
}

/**
 * Walking minutes estimate using the same 80 m/min pace the backend
 * uses for `approxTimeMin`. Returned as an integer.
 */
export function walkingMinutes(km) {
  if (!isNum(km)) return null;
  return Math.max(1, Math.round((km * 1000) / 80));
}
