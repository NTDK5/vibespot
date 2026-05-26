/**
 * spotHelpers — domain helpers shared by Home, Explore, and Map.
 *
 * These were originally inlined in each screen during chunks 1 and 2.
 * Chunk 3 hoists them here so a single source of truth covers the
 * three Field Guide Discovery screens and any future screen that
 * needs to talk about a spot.
 *
 * Geo math stays in `./geo` — this file imports those primitives and
 * layers spot-specific shaping (vibe gradient, pin color, open hours
 * parsing, NO. XXX stamp ids) on top.
 */

import {
  haversineKm,
  kmToMiles,
  formatMiles,
  walkingMinutes,
  pickCoords,
} from './geo';

/* ─────────────────────────────────────────────────────────────────── */
/*  CATEGORY → vibe gradient                                           */
/* ─────────────────────────────────────────────────────────────────── */

const CATEGORY_VIBE = Object.freeze({
  photo_spot:    'roof',
  activity:      'park',
  gallery:       'gallery',
  workspace:     'studio',
  restaurant:    'cafe',
  cafe:          'cafe',
  art:           'gallery',
  sports:        'court',
  entertainment: 'night',
  nature:        'park',
  nightlife:     'night',
  rooftop:       'roof',
  waterfront:    'water',
  bar:           'night',
});

export function vibeForCategory(category) {
  if (!category) return 'cafe';
  return CATEGORY_VIBE[String(category).toLowerCase()] || 'cafe';
}

/* ─────────────────────────────────────────────────────────────────── */
/*  CATEGORY → pin/dot color token                                     */
/* ─────────────────────────────────────────────────────────────────── */

// Token keys map to Field Guide accents:
//   ember = primary action / hot tip
//   cream = paper / gallery
//   moss  = park / nature
//   rose  = night / error
//   gold  = editor's pick (caller can pass `{ isEditorsPick: true }`)
const CATEGORY_COLOR = Object.freeze({
  cafe:          'ember',
  restaurant:    'ember',
  photo_spot:    'ember',
  activity:      'moss',
  gallery:       'cream',
  art:           'cream',
  workspace:     'cream',
  park:          'moss',
  nature:        'moss',
  sports:        'moss',
  nightlife:     'rose',
  entertainment: 'rose',
  bar:           'rose',
  rooftop:       'ember',
  waterfront:    'cream',
});

/**
 * Returns one of: 'ember' | 'cream' | 'moss' | 'rose' | 'gold'.
 * Pass a spot record (or anything truthy under `isEditorsPick`) to
 * promote the color to gold for editor's-pick highlights.
 */
export function categoryColor(category, opts = {}) {
  if (opts?.isEditorsPick) return 'gold';
  if (!category) return 'ember';
  return CATEGORY_COLOR[String(category).toLowerCase()] || 'ember';
}

/* ─────────────────────────────────────────────────────────────────── */
/*  STRING / ID HELPERS                                                */
/* ─────────────────────────────────────────────────────────────────── */

export function zeroPad(n, width = 3) {
  return String(n ?? '').padStart(width, '0');
}

export function prettyCategory(category) {
  if (!category) return '';
  return String(category).replace(/_/g, ' ');
}

/**
 * Stable-looking "NO. XXX" index pulled from the trailing digits of a
 * spot id; falls back to the list index when the id is non-numeric.
 */
export function indexForSpot(spot, fallbackIndex = 0) {
  const raw = String(spot?.id || '');
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 2) return digits.slice(-3).padStart(3, '0');
  return zeroPad(fallbackIndex + 1);
}

/**
 * Index number formatter that prefers an explicit `spot.indexNumber`
 * (some endpoints expose one) and otherwise reuses indexForSpot's
 * digit-extraction logic. No fallback to the list index — caller can
 * pass a list index via `indexForSpot` directly when needed.
 */
export function indexNumberFor(spot) {
  if (spot?.indexNumber != null) {
    return zeroPad(spot.indexNumber);
  }
  return indexForSpot(spot, 0);
}

/* ─────────────────────────────────────────────────────────────────── */
/*  TITLE / NAME HELPERS                                               */
/* ─────────────────────────────────────────────────────────────────── */

/**
 * splitTitle — for the Spot Detail / Photo Viewer kicker. Returns the
 * title broken into two lines (last word on its own) when the input is
 * a multi-word string longer than `maxLineLen`. Single-word or short
 * titles render on one line ({ line2: null }).
 */
export function splitTitle(title, maxLineLen = 12) {
  if (!title || typeof title !== 'string') {
    return { line1: String(title || ''), line2: null };
  }
  const t = title.trim();
  if (t.length <= maxLineLen || !t.includes(' ')) {
    return { line1: t, line2: null };
  }
  const last = t.lastIndexOf(' ');
  return { line1: t.slice(0, last), line2: t.slice(last + 1) };
}

/**
 * Single uppercase initial for an avatar tile, "?" when name is empty.
 */
export function initialFor(name) {
  if (!name || typeof name !== 'string') return '?';
  const ch = name.trim().charAt(0).toUpperCase();
  return ch || '?';
}

/**
 * Deterministic palette pick for an avatar tile. Returns a Field
 * Guide accent key — caller looks the colour up in `fieldGuide.{key}`.
 */
const AVATAR_HUES = ['emberSoft', 'moss', 'gold', 'rose'];
export function avatarHueFor(seed) {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}

/* ─────────────────────────────────────────────────────────────────── */
/*  WALKING ESTIMATE                                                   */
/* ─────────────────────────────────────────────────────────────────── */

/**
 * walkMinutes — integer minute estimate for a meter-distance value
 * using a slow-city pace (default 5 km/h). Returns null when the
 * input cannot be coerced to a positive number.
 *
 * Mirrors `walkingMinutes` from utils/geo (km input) but operates in
 * meters so callers handling raw distance fields can drop in.
 */
export function walkMinutes(distanceMeters, kmh = 5) {
  if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters)) {
    return null;
  }
  if (distanceMeters <= 0) return null;
  const km = distanceMeters / 1000;
  return Math.max(1, Math.round((km / kmh) * 60));
}

/* ─────────────────────────────────────────────────────────────────── */
/*  DISTANCE                                                           */
/* ─────────────────────────────────────────────────────────────────── */

/**
 * Distance between two locations (objects with lat/lng or
 * latitude/longitude or a nested `location` member), in miles.
 * Returns null when either pair can't be resolved.
 */
export function distanceMiles(a, b) {
  const ca = pickCoords(a);
  const cb = pickCoords(b);
  if (!ca || !cb) return null;
  const km = haversineKm(ca.lat, ca.lng, cb.lat, cb.lng);
  if (km == null) return null;
  return kmToMiles(km);
}

/**
 * Editorial distance pill from a raw meter count.
 * For backend payloads that already carry distance in meters, this is
 * the one-shot formatter — falls back to a walking-minutes string when
 * the meters value is < 50 (too short to render meaningfully in MI).
 */
export function distanceLabel(meters) {
  if (typeof meters !== 'number' || Number.isNaN(meters)) return null;
  if (meters <= 0) return null;
  if (meters < 50) {
    const mins = walkingMinutes(meters / 1000);
    return mins != null ? `${mins} MIN` : null;
  }
  return formatMiles(meters / 1000);
}

/* ─────────────────────────────────────────────────────────────────── */
/*  OPEN HOURS                                                         */
/* ─────────────────────────────────────────────────────────────────── */

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function toMinutes(t) {
  if (typeof t !== 'string') return null;
  const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(t.trim());
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = m[2] ? Math.min(59, Math.max(0, parseInt(m[2], 10))) : 0;
  return h * 60 + min;
}

function formatHour(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return String(h);
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * openStatus — defensive shape probing for `spot.hours`.
 *
 *   { isOpen: true,  label: "OPEN · 8–17" }
 *   { isOpen: false, label: "CLOSED · OPENS 11" }
 *   { isOpen: null,  label: "—" }   // hours absent or unparseable
 *
 * Accepted hours shapes:
 *   - { open247: true }
 *   - { today: { open, close } }
 *   - { mon: { open, close }, tue: ... }              (keys lowercase)
 *   - [ { day: 0..6, open, close } ]
 */
export function openStatus(spot, now = new Date()) {
  const h = spot?.hours;
  if (!h) return { isOpen: null, label: '—' };

  if (h.open247 === true || h.is24h === true) {
    return { isOpen: true, label: 'OPEN · 24H' };
  }

  let todayWindow = null;

  if (h.today && (h.today.open || h.today.close)) {
    todayWindow = { open: h.today.open, close: h.today.close };
  } else if (Array.isArray(h)) {
    const day = now.getDay();
    const entry = h.find((e) => Number(e?.day) === day);
    if (entry && (entry.open || entry.close)) {
      todayWindow = { open: entry.open, close: entry.close };
    }
  } else if (typeof h === 'object') {
    const key = DAY_KEYS[now.getDay()];
    const entry = h[key];
    if (entry && (entry.open || entry.close)) {
      todayWindow = { open: entry.open, close: entry.close };
    }
  }

  if (!todayWindow) return { isOpen: null, label: '—' };

  const openMin = toMinutes(todayWindow.open);
  const closeMin = toMinutes(todayWindow.close);
  if (openMin == null || closeMin == null) {
    return { isOpen: null, label: '—' };
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isOpen = nowMin >= openMin && nowMin <= closeMin;

  if (isOpen) {
    return {
      isOpen: true,
      label: `OPEN · ${formatHour(openMin)}–${formatHour(closeMin)}`,
    };
  }
  if (nowMin < openMin) {
    return { isOpen: false, label: `CLOSED · OPENS ${formatHour(openMin)}` };
  }
  return { isOpen: false, label: 'CLOSED' };
}
