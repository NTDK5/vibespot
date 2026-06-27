import { prettyCategory, vibeForCategory } from './spotHelpers';

const CHALLENGE_STOP_COUNT = 3;

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

export function mapSpotToChallengeStop(spot, { number, visited, isNextSuggested }) {
  return {
    id: spot.id,
    number,
    visited,
    isNextSuggested,
    title: spot.title || spot.name || 'Untitled spot',
    whenTag: resolveWhenTag(spot),
    hook: stopHook(spot),
    vibeLabel: vibeLabelForSpot(spot),
    category: prettyCategory(spot.category),
    vibe: vibeForCategory(spot.category),
    imageUri: spotImageUri(spot),
    spot,
  };
}

/**
 * Build exactly 3 challenge stop rows with visit-based node states.
 */
export function buildChallengeStops(picks, visitedSpotIds = []) {
  const ids = new Set(Array.isArray(visitedSpotIds) ? visitedSpotIds : [...visitedSpotIds]);
  const sliced = (Array.isArray(picks) ? picks : []).slice(0, CHALLENGE_STOP_COUNT);
  if (sliced.length < CHALLENGE_STOP_COUNT) return null;

  const noneVisited = ids.size === 0;
  let assignedNext = false;

  return sliced.map((spot, index) => {
    const visited = ids.has(spot.id);
    const isNextSuggested = noneVisited && !visited && !assignedNext;
    if (isNextSuggested) assignedNext = true;
    return mapSpotToChallengeStop(spot, {
      number: index + 1,
      visited,
      isNextSuggested,
    });
  });
}

export function getChallengeNodeState(stop) {
  if (stop?.visited) return 'visited';
  if (stop?.isNextSuggested) return 'next';
  return 'unvisited';
}

export function normalizeEditorsPickChallengeResponse(apiData) {
  if (!apiData || apiData?.error) return null;
  if (!Array.isArray(apiData.picks) || apiData.picks.length < 3) return null;
  return {
    kicker: apiData.kicker || 'THIS WEEK · CHALLENGE',
    title: apiData.title || "Editor's picks",
    subtitle: apiData.subtitle || 'Visit all 3 spots to earn bonus XP',
    challengeKey: apiData.challengeKey ?? null,
    picks: apiData.picks.slice(0, 3),
    progress: {
      visitedSpotIds: apiData.progress?.visitedSpotIds ?? [],
      visitedCount: apiData.progress?.visitedCount ?? 0,
      total: apiData.progress?.total ?? 3,
      completed: !!apiData.progress?.completed,
      bonusXpAwarded: !!apiData.progress?.bonusXpAwarded,
      bonusXpAmount: apiData.progress?.bonusXpAmount ?? 50,
    },
  };
}
