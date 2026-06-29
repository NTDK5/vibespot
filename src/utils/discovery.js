/**
 * discovery — mood/vibe-first search intelligence for Explore.
 *
 * Vibespot's promise is "What are you in the mood for?", so discovery is
 * organised around *moods* rather than raw categories. Each mood is an
 * intent bundle that maps to:
 *   - `tags`       → vibe/amenity tags spots already carry (see Add Spot's
 *                    VIBE_OPTIONS + the amenity catalog, both stored
 *                    lowercased into `spot.tags`)
 *   - `categories` → spot categories that tend to deliver that mood
 *
 * These bundles power three things on the client, with zero backend or
 * schema changes (the signal is already on every search result):
 *   1. Tappable mood chips that act as intent entry points.
 *   2. A real "Best match" relevance score (`scoreSpot` / `rankSpots`).
 *   3. Matched-vibe chips surfaced on result cards (`matchedTagsForSpot`).
 */

import { distanceKmFromUser } from './geo';

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Canonical mood catalog. `tags` are matched (normalized) against
 * `spot.tags`; `categories` against `spot.category`. Icons are valid
 * Ionicons names.
 */
export const MOODS = Object.freeze([
  {
    key: 'cozy',
    label: 'Cozy',
    icon: 'cafe-outline',
    tags: ['slow', 'cardamom bun'],
    categories: ['cafe', 'restaurant'],
  },
  {
    key: 'focus',
    label: 'Focus',
    icon: 'laptop-outline',
    tags: ['slow', 'solo-friendly', 'wifi', 'power outlets', 'quiet'],
    categories: ['workspace', 'cafe'],
  },
  {
    key: 'lively',
    label: 'Lively',
    icon: 'people-outline',
    tags: ['crowded', 'for friends', 'live music'],
    categories: ['nightlife', 'bar', 'entertainment', 'restaurant'],
  },
  {
    key: 'romantic',
    label: 'Romantic',
    icon: 'wine-outline',
    tags: ['good light', 'worth the walk'],
    categories: ['rooftop', 'restaurant', 'waterfront', 'gallery'],
  },
  {
    key: 'scenic',
    label: 'Scenic',
    icon: 'camera-outline',
    tags: ['good light', 'worth the walk', 'outdoor seating'],
    categories: ['rooftop', 'nature', 'waterfront', 'photo_spot'],
  },
  {
    key: 'quiet',
    label: 'Quiet',
    icon: 'moon-outline',
    tags: ['slow', 'solo-friendly', 'quiet'],
    categories: ['gallery', 'nature', 'cafe', 'workspace'],
  },
  {
    key: 'latenight',
    label: 'Late-night',
    icon: 'beer-outline',
    tags: ['late-night', 'crowded'],
    categories: ['nightlife', 'bar', 'entertainment'],
  },
  {
    key: 'outdoors',
    label: 'Outdoorsy',
    icon: 'leaf-outline',
    tags: ['worth the walk', 'outdoor seating', 'pet friendly'],
    categories: ['nature', 'park', 'waterfront', 'activity'],
  },
]);

export const MOOD_BY_KEY = Object.freeze(
  MOODS.reduce((acc, m) => {
    acc[m.key] = m;
    return acc;
  }, {}),
);

export function moodLabel(key) {
  return MOOD_BY_KEY[key]?.label || '';
}

/**
 * Time-of-day mood suggestion — a soft "for right now" nudge, never
 * auto-applied. Morning → focus, midday → cozy, afternoon → scenic,
 * evening → lively, late → latenight.
 */
export function suggestedMoodKey(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'focus';
  if (h >= 11 && h < 15) return 'cozy';
  if (h >= 15 && h < 18) return 'scenic';
  if (h >= 18 && h < 22) return 'lively';
  return 'latenight';
}

function spotTagSet(spot) {
  const tags = Array.isArray(spot?.tags) ? spot.tags : [];
  return new Set(tags.map(normalize).filter(Boolean));
}

/**
 * Relevance score for a spot given the selected moods. Higher is better.
 * Blends mood fit (tag overlap + category fit) with universal quality
 * signals (rating, trending rank, saves) and proximity when known.
 */
export function scoreSpot(spot, moodKeys = [], location = null) {
  if (!spot) return 0;
  let score = 0;

  const tags = spotTagSet(spot);
  const cat = normalize(spot.category);

  if (Array.isArray(moodKeys) && moodKeys.length) {
    for (const key of moodKeys) {
      const mood = MOOD_BY_KEY[key];
      if (!mood) continue;
      const tagHits = mood.tags.reduce(
        (n, t) => (tags.has(normalize(t)) ? n + 1 : n),
        0,
      );
      score += tagHits * 28;
      if (mood.categories.some((c) => normalize(c) === cat)) score += 22;
    }
  }

  // Universal quality signals — keep good spots near the top even when
  // a mood matches loosely.
  score += (Number(spot.ratingAvg ?? spot.rating) || 0) * 4;
  const weeklyRank = Number(spot.weeklyRank);
  if (weeklyRank > 0) score += Math.max(0, 12 - weeklyRank);
  score += Math.min(Number(spot.savedCount) || 0, 25) * 0.2;
  if (spot.isWeeklyChampion || spot.weeklyChampionAt) score += 6;

  // Proximity — closer is better, in soft bands.
  if (location) {
    const km = distanceKmFromUser(location, spot);
    if (km != null) {
      if (km <= 1) score += 12;
      else if (km <= 5) score += 8;
      else if (km <= 15) score += 4;
    }
  }

  return score;
}

/**
 * Returns a new array sorted by best match (descending score), with
 * rating as a stable tiebreaker.
 */
export function rankSpots(spots, moodKeys = [], location = null) {
  if (!Array.isArray(spots) || spots.length === 0) return spots || [];
  return spots
    .map((spot, idx) => ({ spot, idx, score: scoreSpot(spot, moodKeys, location) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ra = Number(a.spot?.ratingAvg ?? a.spot?.rating) || 0;
      const rb = Number(b.spot?.ratingAvg ?? b.spot?.rating) || 0;
      if (rb !== ra) return rb - ra;
      return a.idx - b.idx; // stable
    })
    .map((entry) => entry.spot);
}

/**
 * Display chips for a spot's vibe. When moods are selected, the tags that
 * actually match those moods are returned first and flagged `matched` so
 * the UI can highlight *why* a spot surfaced. Falls back to the spot's
 * own top tags otherwise.
 */
export function matchedTagsForSpot(spot, moodKeys = [], max = 2) {
  const tags = Array.isArray(spot?.tags) ? spot.tags : [];
  if (!tags.length) return [];

  const moodTagSet = new Set();
  if (Array.isArray(moodKeys)) {
    for (const key of moodKeys) {
      const mood = MOOD_BY_KEY[key];
      if (!mood) continue;
      mood.tags.forEach((t) => moodTagSet.add(normalize(t)));
    }
  }

  const seen = new Set();
  const out = [];
  for (const raw of tags) {
    const norm = normalize(raw);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push({ label: raw.toUpperCase(), matched: moodTagSet.has(norm) });
  }

  // Matched tags first, preserve order otherwise.
  out.sort((a, b) => Number(b.matched) - Number(a.matched));
  return out.slice(0, max);
}
