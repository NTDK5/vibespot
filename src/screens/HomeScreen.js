/**
 * HomeScreen — discovery header, champion, picks, trending, walking, moods.
 *
 * Source: screens/07-home.html (discovery header + champion).
 * Top: city loc-btn, search, greeting, quick-stats, filter chips, champion.
 * Below unchanged: Editor's Picks, Trending, Within Walking, By Mood.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets as useSafeAreaInsetsHook } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';
import {
  ChampionCard,
  DuotoneVibe,
  EditorsPickChallengeCard,
  EditorsPickChallengeSkeleton,
  EditorsPickCompleteModal,
  IndexStamp,
  LoadingScreen,
  MonoMeta,
  SectionHead,
  SpotCard,
} from '../components/fieldguide';
import HomeDiscoveryHeader from '../components/home/HomeDiscoveryHeader';
import ServiceAreaBanner from '../components/home/ServiceAreaBanner';
import { getServiceAreaCenter } from '../config/serviceArea';
import { useServiceArea } from '../hooks/useServiceArea';

import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { usePersonalizedSpots } from '../hooks/usePersonalizedSpots';
import { useToast } from '../components/ToastProvider';

import {
  getAllSpots,
  searchSpots,
  getNearbySpots,
  getEditorsPickChallenge,
  getWeeklyChampionSpot,
} from '../services/spots.service';
import { getWeeklySpotRanks } from '../services/weeklyRank.service';
import {
  getSavedSpots,
  isSpotSaved,
  saveSpot,
  unsaveSpot,
} from '../services/savedSpots.service';
import { getVisitedSpots } from '../services/visitedSpots.service';

import { CATEGORIES } from '../utils/constants';
import { logger } from '../utils/logger';
import { track, Events } from '../analytics';
import { distanceKmFromUser, formatMiles, walkingMinutes } from '../utils/geo';
import {
  normalizeEditorsPickChallengeResponse,
} from '../utils/editorsPickChallengeHelpers';
import {
  markEditorsChallengeCelebrated,
  wasEditorsChallengeCelebrated,
} from '../utils/editorsChallengeStorage';
import { openEditorsRouteInMaps } from '../utils/editorsRouteHelpers';
import { openStatus } from '../utils/spotHelpers';

const PAGE_PAD = 22;
const TAB_BAR_SPACE = 96; // FieldGuideTabBar height + safe gap

// Map a backend category id to one of the Field Guide vibe gradients.
// Used by SpotCard / ChampionCard / DuotoneVibe so every card carries
// the right duotone wash without needing a real photo.
const CATEGORY_VIBE = {
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
};

// Ionicons name → CATEGORIES entry already provides one; we keep this
// as a fallback if a category arrives without an icon.
const FALLBACK_ICON = 'ellipse-outline';

function categoryToVibe(category) {
  if (!category) return 'cafe';
  const key = String(category).toLowerCase();
  return CATEGORY_VIBE[key] || 'cafe';
}

function getFirstName(user) {
  if (!user?.name || typeof user.name !== 'string') return 'explorer';
  const first = user.name.trim().split(/\s+/)[0];
  return first || 'explorer';
}

function prettyCategory(category) {
  if (!category) return '';
  return String(category).replace(/_/g, ' ');
}

function pickImageUri(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'object') {
    const candidate = value.uri || value.url || value.secure_url || value.src;
    if (typeof candidate === 'string') return candidate.trim() || null;
  }
  return null;
}

function buildChampionHook(spot) {
  const tags = Array.isArray(spot?.tags)
    ? spot.tags.filter(Boolean).map(String)
    : [];
  if (tags.length >= 2) {
    return tags.slice(0, 3).join(' · ');
  }
  const desc =
    spot?.description || spot?.blurb || spot?.summary || '';
  if (!desc) return undefined;
  if (desc.length <= 60) return desc;
  return `${desc.slice(0, 57).trim()}…`;
}

// Defensive accessor for trending rows. The /weeklyspotrank endpoint
// has shipped both shapes ({rank, spot:{...}}) and a flattened one,
// so try the wrapper first and fall back to the item itself.
function pickRank(item, key) {
  if (item == null) return undefined;
  if (item[key] != null) return item[key];
  if (item.spot && item.spot[key] != null) return item.spot[key];
  return undefined;
}

function getCategoryCount(spots, categoryId) {
  if (!Array.isArray(spots) || !categoryId) return 0;
  return spots.filter((s) => s?.category === categoryId).length;
}

/** Map a backend spot record onto the shape SpotCard / ChampionCard expect. */
function toFieldSpot(spot, { distance, indexNumber } = {}) {
  if (!spot) return null;
  const imageUri =
    spot.thumbnail ||
    (Array.isArray(spot.images) && spot.images.length ? spot.images[0] : undefined);
  return {
    id: spot.id,
    title: spot.title || spot.name || 'Untitled spot',
    vibe: categoryToVibe(spot.category),
    indexNumber,
    district: spot.district || spot.neighbourhood || spot.city || undefined,
    category: prettyCategory(spot.category),
    distance,
    rating:
      typeof spot.ratingAvg === 'number'
        ? spot.ratingAvg
        : typeof spot.rating === 'number'
          ? spot.rating
          : undefined,
    ratingCount: spot.ratingCount ?? spot.reviewCount ?? undefined,
    savedCount: spot.savedCount ?? spot.saveCount ?? undefined,
    isWeeklyChampion:
      spot.weeklyChampionAt != null ||
      !!spot.isWeeklyChampion ||
      !!spot.weeklyChampion,
    savedByMe: !!spot.savedByMe,
    image: imageUri ? { uri: imageUri } : undefined,
    blurb: spot.description || spot.blurb || spot.summary || undefined,
  };
}

// Pull a numeric tail off a spot id so the IndexStamp on each card
// reads like "NO. 042". Falls back to a list-position derived value
// when the id is non-numeric.
function indexForSpot(spot, fallbackIndex) {
  const raw = String(spot?.id || '');
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 2) return digits.slice(-3).padStart(3, '0');
  return String(fallbackIndex + 1).padStart(3, '0');
}

/* ─────────────────────────────────────────────────────────────────── */
/*  TRENDING ROW                                                       */
/* ─────────────────────────────────────────────────────────────────── */

function TrendingRow({ item, position, isLast, onPress }) {

  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const rank = pickRank(item, 'rank') ?? position + 1;
  const prev = pickRank(item, 'previousRank');
  const change = typeof prev === 'number' && typeof rank === 'number'
    ? prev - rank
    : null;

  const title = pickRank(item, 'title') || pickRank(item, 'name') || 'Untitled spot';
  const category = prettyCategory(pickRank(item, 'category'));
  const district =
    pickRank(item, 'district') ||
    pickRank(item, 'neighbourhood') ||
    pickRank(item, 'city');
  const vibe = categoryToVibe(pickRank(item, 'category'));

  const rankLabel = String(rank).padStart(2, '0');
  const rankColor = change != null && change > 0
    ? fieldGuide.cream
    : fieldGuide.creamMute;

  let arrowText = '—';
  let arrowColor = fieldGuide.creamMute;
  if (change != null && change > 0) {
    arrowText = `↑ ${change}`;
    arrowColor = fieldGuide.moss;
  } else if (change != null && change < 0) {
    arrowText = `↓ ${Math.abs(change)}`;
    arrowColor = fieldGuide.rose;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Trending #${rankLabel}: ${title}`}
      style={({ pressed }) => [
        styles.trendRow,
        isLast ? styles.trendRowLast : null,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.trendNumber, { color: rankColor }]}>{rankLabel}</Text>

      <View style={styles.trendThumb}>
        <DuotoneVibe vibe={vibe} />
        <IndexStamp position="tl">NO. {rankLabel}</IndexStamp>
      </View>

      <View style={styles.trendBody}>
        <Text style={styles.trendTitle} numberOfLines={1}>{title}</Text>
        <MonoMeta size="spot" style={styles.trendMeta}>
          {[category, district].filter(Boolean).join('  ·  ')}
        </MonoMeta>
      </View>

      <Text style={[styles.trendArrow, { color: arrowColor }]}>{arrowText}</Text>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  MOOD GRID                                                          */
/* ─────────────────────────────────────────────────────────────────── */

function MoodCard({ category, count, onPress }) {

  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${category.label}`}
      style={({ pressed }) => [
        styles.moodCard,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.moodIcon}>
        <Ionicons
          name={category.icon || FALLBACK_ICON}
          size={14}
          color={fieldGuide.ember}
        />
      </View>
      <View>
        <Text style={styles.moodName} numberOfLines={2}>{category.label}</Text>
        {count > 0 ? (
          <MonoMeta size="spot" style={styles.moodCount}>
            {`${count} SPOT${count === 1 ? '' : 'S'}`}
          </MonoMeta>
        ) : null}
      </View>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  EMPTY PLACEHOLDERS                                                 */
/* ─────────────────────────────────────────────────────────────────── */

function GhostPickCard({ label = 'NO ENTRIES YET' }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.ghostCard}>
      <View style={styles.ghostPhoto} />
      <MonoMeta size="spot" style={styles.ghostLabel}>{label}</MonoMeta>
    </View>
  );
}

function ChampionSkeleton() {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.championSkeleton} />;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  HOMESCREEN                                                         */
/* ─────────────────────────────────────────────────────────────────── */

export const HomeScreen = ({ navigation }) => {

  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const toast = useToast();
  const insets =
    typeof useSafeAreaInsetsHook === 'function'
      ? useSafeAreaInsetsHook()
      : { top: 0, bottom: 0, left: 0, right: 0 };
  const { location } = useLocation();
  const { inServiceArea, showBanner, dismissBanner, locationLoading } = useServiceArea();

  // Warm the personalized-spots cache so downstream screens (Explore,
  // SpotDetail's "More like this") read it instantly.
  usePersonalizedSpots(location);

  const [spots, setSpots] = useState([]);
  const [nearbySpots, setNearbySpots] = useState([]);
  const [weeklyRanks, setWeeklyRanks] = useState([]);
  const [editorsChallenge, setEditorsChallenge] = useState(null);
  const [editorsLoading, setEditorsLoading] = useState(true);
  const [challengeCongrats, setChallengeCongrats] = useState(null);
  const [weeklyChampion, setWeeklyChampion] = useState(null);
  const [championSaved, setChampionSaved] = useState(false);
  const [stats, setStats] = useState({ nearbyCount: 0, visitedSpots: 0, savedSpots: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('for_you');

  /* ── loaders ─────────────────────────────────────────────────── */

  const loadSpots = useCallback(async () => {
    try {
      const response = await getAllSpots();
      const arr = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setSpots(arr);
    } catch (error) {
      logger.error({
        service: 'home',
        action: 'load_spots_error',
        message: 'Error loading spots',
        metadata: { error: error?.message || String(error) },
      });
      setSpots([]);
    }
  }, []);

  const locationLat = location?.latitude ?? null;
  const locationLng = location?.longitude ?? null;

  const loadNearby = useCallback(async (lat, lng) => {
    if (lat == null || lng == null) return;
    try {
      const result = await getNearbySpots(lat, lng, 5000);
      if (Array.isArray(result)) setNearbySpots(result);
    } catch (error) {
      logger.error({
        service: 'home',
        action: 'load_nearby_error',
        message: 'Error loading nearby spots',
        metadata: { error: error?.message || String(error) },
      });
    }
  }, []);

  const loadWeeklyRanks = useCallback(async () => {
    try {
      const result = await getWeeklySpotRanks();
      if (!result?.error && Array.isArray(result?.spots)) {
        setWeeklyRanks(result.spots);
      }
    } catch (error) {
      logger.error({
        service: 'home',
        action: 'load_weekly_ranks_error',
        message: 'Error loading weekly ranks',
        metadata: { error: error?.message || String(error) },
      });
    }
  }, []);

  const loadEditorsSection = useCallback(async () => {
    try {
      const result = await getEditorsPickChallenge();
      const normalized = normalizeEditorsPickChallengeResponse(result);
      setEditorsChallenge(normalized);
      if (normalized?.picks?.length >= 3) {
        track(Events.EDITORS_PICK_CHALLENGE_VIEWED, {
          challenge_key: normalized.challengeKey,
          visited_count: normalized.progress?.visitedCount ?? 0,
          completed: normalized.progress?.completed ?? false,
        });
      }
    } catch (error) {
      logger.error({
        service: 'home',
        action: 'load_editors_section_error',
        message: "Error loading editor's picks challenge",
        metadata: { error: error?.message || String(error) },
      });
      setEditorsChallenge(null);
    } finally {
      setEditorsLoading(false);
    }
  }, []);

  const loadWeeklyChampion = useCallback(async () => {
    try {
      const result = await getWeeklyChampionSpot();
      if (!result?.error && result?.id) {
        setWeeklyChampion(result);
      } else {
        setWeeklyChampion(null);
      }
    } catch (error) {
      logger.error({
        service: 'home',
        action: 'load_weekly_champion_error',
        message: 'Error loading weekly champion',
        metadata: { error: error?.message || String(error) },
      });
      setWeeklyChampion(null);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [savedResult, visitedResult] = await Promise.all([
        getSavedSpots(),
        getVisitedSpots(),
      ]);
      const savedCount = Array.isArray(savedResult) ? savedResult.length : 0;
      const visitedCount = Array.isArray(visitedResult) ? visitedResult.length : 0;
      setStats((s) => ({
        ...s,
        savedSpots: savedCount,
        visitedSpots: visitedCount,
      }));
    } catch (error) {
      logger.error({
        service: 'home',
        action: 'load_stats_error',
        message: 'Error loading stats',
        metadata: { error: error?.message || String(error) },
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.allSettled([
          loadSpots(),
          loadWeeklyRanks(),
          loadEditorsSection(),
          loadWeeklyChampion(),
          loadStats(),
        ]);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSpots, loadWeeklyRanks, loadEditorsSection, loadWeeklyChampion, loadStats]);

  useEffect(() => {
    if (inServiceArea === false || (inServiceArea === null && !locationLoading && !location)) {
      const center = getServiceAreaCenter();
      loadNearby(center.latitude, center.longitude);
      return;
    }
    if (inServiceArea === true && locationLat != null && locationLng != null) {
      loadNearby(locationLat, locationLng);
    }
  }, [location, locationLat, locationLng, inServiceArea, locationLoading, loadNearby]);

  useEffect(() => {
    setStats((s) => ({ ...s, nearbyCount: nearbySpots.length }));
  }, [nearbySpots]);

  useFocusEffect(
    useCallback(() => {
      if (initialLoading) return;
      loadEditorsSection();
    }, [initialLoading, loadEditorsSection]),
  );

  useFocusEffect(
    useCallback(() => {
      if (initialLoading) return;
      const coreEmpty =
        spots.length === 0 &&
        !editorsChallenge?.picks?.length &&
        weeklyRanks.length === 0 &&
        !weeklyChampion;
      if (!coreEmpty) return;
      Promise.allSettled([
        loadSpots(),
        loadWeeklyRanks(),
        loadEditorsSection(),
        loadWeeklyChampion(),
        loadStats(),
      ]);
    }, [
      initialLoading,
      spots.length,
      editorsChallenge?.picks?.length,
      weeklyRanks.length,
      weeklyChampion,
      loadSpots,
      loadWeeklyRanks,
      loadEditorsSection,
      loadWeeklyChampion,
      loadStats,
    ]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadSpots(),
        loadWeeklyRanks(),
        loadEditorsSection(),
        loadWeeklyChampion(),
        loadStats(),
        locationLat != null && locationLng != null
          ? loadNearby(locationLat, locationLng)
          : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    loadSpots,
    loadWeeklyRanks,
    loadEditorsSection,
    loadWeeklyChampion,
    loadStats,
    loadNearby,
    locationLat,
    locationLng,
  ]);

  /* ── derived ─────────────────────────────────────────────────── */

  const userFirstName = useMemo(() => getFirstName(user), [user]);
  const homeCity = user?.homeCity || null;
  const nearbyCount = stats.nearbyCount;
  const nearbyTrend = nearbyCount > 0 ? `↑${Math.min(4, nearbyCount)}` : undefined;

  const championProps = useMemo(() => {
    if (!weeklyChampion) return null;
    const distanceKm = distanceKmFromUser(location, weeklyChampion);
    const walkMins = walkingMinutes(distanceKm);
    const hoursStatus = openStatus(weeklyChampion);
    const championImages = [];
    const pushImage = (value) => {
      const uri = pickImageUri(value);
      if (uri) championImages.push(uri);
    };
    pushImage(weeklyChampion.thumbnail);
    pushImage(weeklyChampion.image);
    pushImage(weeklyChampion.coverImage);
    if (Array.isArray(weeklyChampion.images)) {
      weeklyChampion.images.forEach(pushImage);
    }
    const rating =
      typeof weeklyChampion.ratingAvg === 'number'
        ? weeklyChampion.ratingAvg
        : typeof weeklyChampion.rating === 'number'
          ? weeklyChampion.rating
          : 0;
    const ratingCount =
      typeof weeklyChampion.ratingCount === 'number'
        ? weeklyChampion.ratingCount
        : typeof weeklyChampion.reviewCount === 'number'
          ? weeklyChampion.reviewCount
          : 0;
    const savesTrend =
      typeof weeklyChampion.savedCount === 'number'
        ? weeklyChampion.savedCount
        : typeof weeklyChampion.saveCount === 'number'
          ? weeklyChampion.saveCount
          : undefined;
    return {
      id: weeklyChampion.id,
      title: weeklyChampion.title || weeklyChampion.name || "This week's champion",
      hook: buildChampionHook(weeklyChampion),
      vibe: categoryToVibe(weeklyChampion.category),
      category: prettyCategory(weeklyChampion.category),
      distance: distanceKm != null ? formatMiles(distanceKm) : undefined,
      images: [...new Set(championImages)],
      rating,
      ratingCount,
      savesTrend,
      isOpen: hoursStatus.isOpen === true,
      walkLabel: walkMins != null ? `${walkMins} min walk` : undefined,
    };
  }, [weeklyChampion, location]);

  const moodCategories = useMemo(() => CATEGORIES.slice(0, 6), []);

  const handleFilterSelect = useCallback(
    (chip) => {
      setActiveFilter(chip.id);
      navigation.navigate('Explore', chip.params);
    },
    [navigation],
  );

  /* ── renderers ──────────────────────────────────────────────── */

  const goSpotDetail = useCallback(
    (id) => navigation.navigate('SpotDetail', { spotId: id }),
    [navigation],
  );

  useEffect(() => {
    let cancelled = false;
    const spotId = weeklyChampion?.id;
    if (!spotId) {
      setChampionSaved(false);
      return undefined;
    }
    (async () => {
      const saved = await isSpotSaved(spotId);
      if (!cancelled) setChampionSaved(!!saved);
    })();
    return () => {
      cancelled = true;
    };
  }, [weeklyChampion?.id]);

  const handleChampionSave = useCallback(async () => {
    if (!weeklyChampion?.id) return;
    const spotId = weeklyChampion.id;
    const nextSaved = !championSaved;
    setChampionSaved(nextSaved);
    try {
      const result = nextSaved
        ? await saveSpot(spotId)
        : await unsaveSpot(spotId);
      if (result?.error) throw new Error(result.error);
      toast.show(nextSaved ? 'Saved to your pocket.' : 'Removed from saved.', {
        variant: 'success',
      });
      loadStats();
    } catch (err) {
      setChampionSaved(!nextSaved);
      logger.error({
        service: 'home',
        action: 'champion_save_error',
        message: 'Could not update saved state for champion',
        metadata: { error: err?.message || String(err) },
      });
      toast.show('Could not update saved spot.', { variant: 'error' });
    }
  }, [weeklyChampion?.id, championSaved, toast, loadStats]);

  const handleChampionDirections = useCallback(async () => {
    if (!weeklyChampion) return;
    const lat = weeklyChampion.lat ?? weeklyChampion.latitude;
    const lng = weeklyChampion.lng ?? weeklyChampion.longitude;
    if (lat == null || lng == null) {
      goSpotDetail(weeklyChampion.id);
      return;
    }
    const url = `https://maps.google.com/?daddr=${lat},${lng}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      logger.error({
        service: 'home',
        action: 'champion_directions_error',
        message: 'Could not open maps for champion',
        metadata: { error: err?.message || String(err) },
      });
      toast.show('Could not open maps.', { variant: 'error' });
    }
  }, [weeklyChampion, goSpotDetail, toast]);

  const handleEditorsStartRoute = useCallback(async (spots, challenge) => {
    track(Events.EDITORS_PICK_ROUTE_STARTED, {
      stop_count: spots?.length ?? 0,
      challenge_key: challenge?.challengeKey ?? null,
    });
    const result = await openEditorsRouteInMaps(spots);
    if (!result.ok) {
      toast.show(result.error || 'Could not open route.', { variant: 'info' });
      const firstId = spots?.[0]?.id;
      if (firstId) goSpotDetail(firstId);
    }
  }, [toast, goSpotDetail]);

  const handleEditorsStopPress = useCallback((spotId) => {
    track(Events.EDITORS_PICK_CHALLENGE_STOP_TAPPED, { spot_id: spotId });
    goSpotDetail(spotId);
  }, [goSpotDetail]);

  useEffect(() => {
    const key = editorsChallenge?.challengeKey;
    const awarded = editorsChallenge?.progress?.bonusXpAwarded;
    if (!key || !awarded) return;

    (async () => {
      const seen = await wasEditorsChallengeCelebrated(key);
      if (!seen) {
        setChallengeCongrats({
          challengeKey: key,
          bonusXp: editorsChallenge.progress?.bonusXpAmount ?? 50,
        });
        track(Events.EDITORS_PICK_CHALLENGE_COMPLETED, {
          challenge_key: key,
          bonus_xp: editorsChallenge.progress?.bonusXpAmount ?? 50,
        });
      }
    })();
  }, [
    editorsChallenge?.challengeKey,
    editorsChallenge?.progress?.bonusXpAwarded,
    editorsChallenge?.progress?.bonusXpAmount,
  ]);

  const dismissChallengeCongrats = useCallback(async () => {
    if (challengeCongrats?.challengeKey) {
      await markEditorsChallengeCelebrated(challengeCongrats.challengeKey);
    }
    setChallengeCongrats(null);
  }, [challengeCongrats?.challengeKey]);

  const renderNearby = useCallback(
    ({ item }) => {
      const km = distanceKmFromUser(location, item);
      const distLabel = km != null ? formatMiles(km) : undefined;
      const fieldSpot = toFieldSpot(item, {
        indexNumber: distLabel,
        distance: km != null ? `${km.toFixed(1)} KM` : undefined,
      });
      if (!fieldSpot) return null;
      return (
        <SpotCard
          variant="near"
          spot={fieldSpot}
          onPress={() => goSpotDetail(item.id)}
        />
      );
    },
    [goSpotDetail, location],
  );

  const editorsLabel = 'All picks ↗';

  const showWithinWalking = !!location && nearbySpots.length > 0;

  /* ── render ─────────────────────────────────────────────────── */

  if (initialLoading && spots.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ height: 400, overflow: 'hidden' }}>
          <LoadingScreen style={{ height: 400, flex: 0 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_SPACE + Math.max(insets.bottom, 12),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={fieldGuide.ember}
            colors={[fieldGuide.ember]}
          />
        }
      >
        <HomeDiscoveryHeader
          navigation={navigation}
          user={user}
          firstName={userFirstName}
          homeCity={homeCity}
          stats={stats}
          nearbyCount={nearbyCount}
          nearbyTrend={nearbyTrend}
          activeFilter={activeFilter}
          onFilterSelect={handleFilterSelect}
          inServiceArea={inServiceArea}
        />

        {showBanner ? (
          <ServiceAreaBanner
            navigation={navigation}
            onDismiss={dismissBanner}
          />
        ) : null}

        {/* ─── CHAMPION ─────────────────────────────────────── */}
        <View style={styles.championWrap}>
          {championProps ? (
            <ChampionCard
              spot={{
                ...championProps,
                isSaved: championSaved,
                onSave: handleChampionSave,
                onDirections: handleChampionDirections,
              }}
              onPress={() => goSpotDetail(championProps.id)}
            />
          ) : (
            <ChampionSkeleton />
          )}
        </View>

        {/* ─── EDITOR'S PICKS CHALLENGE ───────────────────────── */}
        <SectionHead
          title="Editor's picks"
          cta={{
            label: editorsLabel,
            onPress: () => navigation.navigate('Explore', { filter: 'editors' }),
          }}
        />
        {editorsLoading && !editorsChallenge?.picks?.length ? (
          <EditorsPickChallengeSkeleton />
        ) : editorsChallenge?.picks?.length >= 3 ? (
          <EditorsPickChallengeCard
            challenge={editorsChallenge}
            onStopPress={handleEditorsStopPress}
            onStartRoute={handleEditorsStartRoute}
          />
        ) : (
          <View style={styles.hScrollPad}>
            <GhostPickCard />
          </View>
        )}

        <EditorsPickCompleteModal
          visible={!!challengeCongrats}
          bonusXp={challengeCongrats?.bonusXp ?? 50}
          onDismiss={dismissChallengeCongrats}
        />

        {/* ─── TRENDING THIS WEEK ───────────────────────────── */}
        <SectionHead
          title="Trending this week"
          cta={{
            label: 'All ↗',
            onPress: () => navigation.navigate('Explore', { sort: 'trending' }),
          }}
        />
        {weeklyRanks.length > 0 ? (
          <View style={styles.trendList}>
            {weeklyRanks.map((item, idx) => (
              <TrendingRow
                key={pickRank(item, 'id') || idx}
                item={item}
                position={idx}
                isLast={idx === weeklyRanks.length - 1}
                onPress={() => {
                  const id = pickRank(item, 'id');
                  if (id) goSpotDetail(id);
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.trendSkeletonWrap}>
            {[0, 1, 2, 3].map((k) => (
              <View key={k} style={styles.trendSkeleton} />
            ))}
          </View>
        )}

        {/* ─── WITHIN WALKING ───────────────────────────────── */}
        {showWithinWalking ? (
          <>
            <SectionHead
              title="Within walking"
              cta={{
                label: 'Map ↗',
                onPress: () => navigation.navigate('Map'),
              }}
            />
            <FlatList
              data={nearbySpots}
              keyExtractor={(item, idx) => String(item?.id ?? idx)}
              renderItem={renderNearby}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollPad}
            />
          </>
        ) : null}

        {/* ─── BY MOOD ──────────────────────────────────────── */}
        <SectionHead title="By mood" />
        <View style={styles.moodGrid}>
          {moodCategories.map((cat) => (
            <MoodCard
              key={cat.id}
              category={cat}
              count={getCategoryCount(spots, cat.id)}
              onPress={() => navigation.navigate('Explore', { category: cat.id })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ─────────────────────────────────────────────────────────────────── */
/*  STYLES                                                             */
/* ─────────────────────────────────────────────────────────────────── */

function createStyles(fieldGuide) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },

  championWrap: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 20,
    paddingBottom: 8,
  },
  championSkeleton: {
    width: '100%',
    aspectRatio: 16 / 11,
    borderRadius: fieldGuide.radius.xl,
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
  },

  /* horizontal scrollers */
  hScrollPad: {
    paddingHorizontal: PAGE_PAD,
    gap: 14,
  },

  /* trending */
  trendList: {
    paddingHorizontal: PAGE_PAD,
    gap: 16,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: fieldGuide.inkLine,
  },
  trendRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  trendNumber: {
    width: 36,
    textAlign: 'center',
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 36,
    lineHeight: 43,
    letterSpacing: -0.03 * 36,
    includeFontPadding: true,
  },
  trendThumb: {
    width: 72,
    height: 72,
    borderRadius: fieldGuide.radius.md,
    overflow: 'hidden',
    marginLeft: 14,
    backgroundColor: fieldGuide.inkElev,
    position: 'relative',
  },
  trendBody: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },
  trendTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: -0.005 * 16,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  trendMeta: {
    marginTop: 4,
  },
  trendArrow: {
    marginLeft: 8,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 11,
    letterSpacing: fieldGuide.tracking.wide(11),
    includeFontPadding: false,
  },
  trendSkeletonWrap: {
    paddingHorizontal: PAGE_PAD,
    gap: 14,
  },
  trendSkeleton: {
    height: 72,
    borderRadius: fieldGuide.radius.md,
    backgroundColor: fieldGuide.inkElev,
  },

  /* ghost / empty */
  ghostCard: {
    width: 220,
  },
  ghostPhoto: {
    width: 220,
    aspectRatio: 3 / 4,
    borderRadius: fieldGuide.radius.lg,
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  ghostLabel: {
    marginTop: 10,
  },

  /* mood grid */
  moodGrid: {
    paddingHorizontal: PAGE_PAD,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodCard: {
    width: '48.5%',
    aspectRatio: 16 / 10,
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    backgroundColor: fieldGuide.inkElev,
    padding: 14,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moodIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodName: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.01 * 17,
    color: fieldGuide.cream,
    includeFontPadding: true,
  },
  moodCount: {
    marginTop: 2,
  },
});
}
