import { Linking, Platform } from 'react-native';

import { BRAND } from '../brand/fena';
import { haversineKm, kmToMiles, pickCoords, walkingMinutes } from './geo';
import { prettyCategory, vibeForCategory } from './spotHelpers';

const ROUTE_STOP_COUNT = 3;

function timeOfDayBucket(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function routeKicker(bucket) {
  const when = {
    morning: 'This morning',
    afternoon: 'This afternoon',
    evening: 'Tonight',
    night: 'Tonight',
  }[bucket];
  return `${when || 'Tonight'} · curated`;
}

function routeTitle(bucket) {
  return {
    morning: 'Into the city',
    afternoon: 'The midday thread',
    evening: 'Into the golden hour',
    night: 'After dark',
  }[bucket] || "This week's picks";
}

function resolveWhenTag(spot) {
  if (spot?._routeWhenTag) return String(spot._routeWhenTag);
  if (spot?.bestTime) return String(spot.bestTime);
  const cat = String(spot?.category || '').toLowerCase();
  if (cat === 'cafe' || cat === 'restaurant') return 'Coffee hour';
  if (cat === 'nightlife' || cat === 'bar') return 'Nightcap';
  if (cat === 'gallery' || cat === 'art') return 'Gallery hour';
  if (cat === 'rooftop' || cat === 'photo_spot') return 'Golden hour';
  if (cat === 'park' || cat === 'nature') return 'Open air';
  return 'Worth a stop';
}

function stopHook(spot) {
  const desc = spot?.description || spot?.blurb || spot?.summary || '';
  if (desc) {
    const text = String(desc).trim();
    if (text.length <= 60) return text;
    return `${text.slice(0, 57).trim()}…`;
  }
  const tags = Array.isArray(spot?.tags) ? spot.tags.filter(Boolean) : [];
  if (tags.length) {
    return `${tags[0]} · ${prettyCategory(spot.category)}`.trim();
  }
  return prettyCategory(spot.category) || 'Editor pick';
}

function vibeLabelForSpot(spot) {
  const tags = Array.isArray(spot?.tags)
    ? spot.tags.slice(0, 2).map(String).filter(Boolean)
    : [];
  if (tags.length >= 2) return tags.join(' · ');
  if (tags.length === 1) return tags[0];
  return prettyCategory(spot.category);
}

function spotImageUri(spot) {
  if (spot?.thumbnail) return spot.thumbnail;
  if (Array.isArray(spot?.images) && spot.images.length) return spot.images[0];
  return null;
}

function buildWalkLeg(fromSpot, toSpot) {
  const a = pickCoords(fromSpot);
  const b = pickCoords(toSpot);
  if (!a || !b) return null;
  const km = haversineKm(a.lat, a.lng, b.lat, b.lng);
  if (km == null) return null;
  const minutes = walkingMinutes(km);
  return {
    km,
    minutes,
    label: minutes != null ? `${minutes} min walk` : null,
  };
}

function resolveByline(meta) {
  if (meta.byline) return meta.byline;
  if (meta.editorName) {
    return `Threaded by ${meta.editorName}, city editor`;
  }
  return 'Curated by FENA editors';
}

/**
 * Normalize GET /spot/editors-route payload for Home.
 */
export function normalizeEditorsRouteApiResponse(apiData) {
  const rows = Array.isArray(apiData?.stops) ? apiData.stops : [];
  if (rows.length < 2) return null;

  const picks = rows
    .map((row) => {
      const spot = row?.spot ?? row;
      if (!spot?.id) return null;
      return {
        ...spot,
        _routeWhenTag: row?.whenTag ?? null,
      };
    })
    .filter(Boolean);

  if (picks.length < 2) return null;

  return {
    picks,
    meta: {
      kicker: apiData.kicker,
      title: apiData.title,
      editorName: apiData.editorName,
      byline: apiData.byline,
      source: apiData.source,
    },
  };
}

/**
 * Compose a threaded editor route from picks (client or API metadata).
 */
export function buildEditorsRoute(picks, meta = {}) {
  const stops = (Array.isArray(picks) ? picks : []).slice(0, ROUTE_STOP_COUNT);
  if (stops.length < 2) return null;

  const bucket = timeOfDayBucket();
  const legs = [];
  let totalKm = 0;
  let totalMin = 0;

  for (let i = 0; i < stops.length - 1; i += 1) {
    const leg = buildWalkLeg(stops[i], stops[i + 1]);
    legs.push(leg);
    if (leg?.km) totalKm += leg.km;
    if (leg?.minutes) totalMin += leg.minutes;
  }

  const last = stops[stops.length - 1];
  const endsNear =
    last?.district ||
    last?.neighbourhood ||
    last?.address ||
    BRAND.serviceCityName;

  const miles = kmToMiles(totalKm);
  let distanceLabel = null;
  if (miles != null && miles > 0) {
    distanceLabel = miles < 0.1 ? '< 0.1 mi' : `${miles.toFixed(1)} mi`;
  }

  const durationLabel = totalMin > 0 ? `~${totalMin} min walking` : null;

  return {
    kicker: meta.kicker || routeKicker(bucket),
    title: meta.title || routeTitle(bucket),
    byline: resolveByline(meta),
    editorName: meta.editorName ?? null,
    source: meta.source ?? 'client',
    cityName: BRAND.serviceCityName,
    stopCount: stops.length,
    stops: stops.map((spot, index) => ({
      id: spot.id,
      number: index + 1,
      title: spot.title || spot.name || 'Untitled spot',
      whenTag: resolveWhenTag(spot),
      hook: stopHook(spot),
      vibeLabel: vibeLabelForSpot(spot),
      category: prettyCategory(spot.category),
      vibe: vibeForCategory(spot.category),
      imageUri: spotImageUri(spot),
      spot,
    })),
    legs,
    footer: {
      distanceLabel,
      durationLabel,
      endsNear,
    },
  };
}

function coordStringsFromSpots(spots) {
  return (Array.isArray(spots) ? spots : [])
    .map((s) => {
      const c = pickCoords(s);
      return c ? `${c.lat},${c.lng}` : null;
    })
    .filter(Boolean);
}

/**
 * Open multi-stop walking directions for route stops.
 * Returns { ok, error? }.
 */
export async function openEditorsRouteInMaps(spots) {
  const stops = coordStringsFromSpots(spots);
  if (stops.length < 2) {
    return { ok: false, error: 'Need at least two stops with coordinates.' };
  }

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1).join('|');
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    ...(waypoints ? { waypoints } : {}),
    travelmode: 'walking',
  });

  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?saddr=${origin}&daddr=${destination}`
      : `https://www.google.com/maps/dir/?${params.toString()}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      return { ok: false, error: 'No maps app available.' };
    }
    await Linking.openURL(url);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not open maps.' };
  }
}
