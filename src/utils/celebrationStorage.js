import AsyncStorage from '@react-native-async-storage/async-storage';

export const CELEBRATED_BADGE_IDS_KEY = 'fena.celebratedBadgeIds';
export const HAS_COMPLETED_WELCOME_KEY = 'fena.hasCompletedWelcome';
export const SEEN_SEALS_KEY = 'fena.seenSealIds';
export const WELCOME_EXPLORER_NAME = 'Welcome Explorer';
const WELCOME_CELEBRATION_KEY = 'welcome-explorer';

/** Stable key for persistence — welcome uses a fixed key (ids can drift in dev). */
export function badgeCelebrationKey(badge) {
  if (!badge) return '';
  if (badge.criteriaType === 'entry' || badge.name === WELCOME_EXPLORER_NAME) {
    return WELCOME_CELEBRATION_KEY;
  }
  return String(badge.id ?? badge.name ?? '');
}

export async function loadCelebrationState() {
  let celebratedIds = [];
  let hasCompletedWelcome = false;
  try {
    const rawIds = await AsyncStorage.getItem(CELEBRATED_BADGE_IDS_KEY);
    if (rawIds) {
      const parsed = JSON.parse(rawIds);
      if (Array.isArray(parsed)) celebratedIds = parsed.map(String);
    }
    hasCompletedWelcome =
      (await AsyncStorage.getItem(HAS_COMPLETED_WELCOME_KEY)) === 'true';

    // Migrate users who already saw the seal strip but not the celebration keys.
    const seenRaw = await AsyncStorage.getItem(SEEN_SEALS_KEY);
    if (seenRaw) {
      const seen = JSON.parse(seenRaw);
      if (Array.isArray(seen) && seen.length > 0) {
        celebratedIds = Array.from(
          new Set([...celebratedIds, ...seen.map(String), WELCOME_CELEBRATION_KEY]),
        );
        hasCompletedWelcome = true;
      }
    }
  } catch {
    /* use defaults */
  }
  return { celebratedIds, hasCompletedWelcome };
}

export async function markBadgeCelebrated(badge) {
  const key = badgeCelebrationKey(badge);
  if (!key) return;
  const state = await loadCelebrationState();
  if (state.celebratedIds.includes(key)) return;

  const nextIds = Array.from(new Set([...state.celebratedIds, key]));
  await AsyncStorage.setItem(CELEBRATED_BADGE_IDS_KEY, JSON.stringify(nextIds));

  const isWelcome =
    badge?.criteriaType === 'entry' || badge?.name === WELCOME_EXPLORER_NAME;
  if (isWelcome || key === WELCOME_CELEBRATION_KEY) {
    await AsyncStorage.setItem(HAS_COMPLETED_WELCOME_KEY, 'true');
  }
}

/** Persist before showing so a quick app kill still counts as "seen". */
export async function reserveBadgeCelebration(badge) {
  const key = badgeCelebrationKey(badge);
  if (!key) return false;
  const state = await loadCelebrationState();
  if (state.celebratedIds.includes(key)) return false;
  await markBadgeCelebrated(badge);
  return true;
}

export function pickBadgeToCelebrate(unlockedBadges, state) {
  const pending = (unlockedBadges || []).filter((b) => {
    const key = badgeCelebrationKey(b);
    return key && !state.celebratedIds.includes(key);
  });
  if (!pending.length) return null;

  const nonEntry = pending.filter(
    (b) => b.criteriaType !== 'entry' && b.name !== WELCOME_EXPLORER_NAME,
  );
  if (nonEntry.length) {
    return [...nonEntry].sort(
      (a, b) => new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0),
    )[0];
  }

  const welcome = pending.find(
    (b) => b.criteriaType === 'entry' || b.name === WELCOME_EXPLORER_NAME,
  );
  if (welcome && !state.hasCompletedWelcome) return welcome;
  return null;
}

export function isWelcomeBadge(badge) {
  return (
    badge?.criteriaType === 'entry' || badge?.name === WELCOME_EXPLORER_NAME
  );
}
