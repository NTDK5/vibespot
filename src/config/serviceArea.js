/**
 * FENA launch service area — Addis Ababa.
 * Bounds are approximate city limits for UX messaging, not legal geofencing.
 */

export const SERVICE_AREA = Object.freeze({
  name: 'Addis Ababa',
  country: 'Ethiopia',
  center: {
    latitude: 9.032,
    longitude: 38.7469,
  },
  bounds: {
    north: 9.12,
    south: 8.84,
    east: 38.92,
    west: 38.62,
  },
});

export function getServiceAreaCenter() {
  return { ...SERVICE_AREA.center };
}

export function isInServiceArea(latitude, longitude) {
  if (latitude == null || longitude == null) return false;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  const { north, south, east, west } = SERVICE_AREA.bounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}
