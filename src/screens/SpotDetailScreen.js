/**
 * SpotDetailScreen — discovery layout (screens/13-spot-detail.html).
 *
 * Hero carousel, title chips, rating row, actions, story, hours,
 * location, reviews preview, similar spots, sticky walk CTA.
 * Data: getSpotById, vibes, comments, nearby, save/visit, review guard.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { BRAND } from '../brand/fena';
import {
  CollectionPickerSheet,
  DuotoneVibe,
  EditorialButton,
  EmptyState,
  HourBarChart,
  IconSquare,
  MiniMap,
  RatingDots,
  ReviewRow,
  ShareDispatchSheet,
  EditorsPickCompleteModal,
} from '../components/fieldguide';
import VisitStampButton from '../components/fieldguide/spot/VisitStampButton';
import { LivePulseDot } from '../components/home/LivePulseDot';
import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import { track, Events } from '../analytics';
import { useAuth } from '../hooks/useAuth';
import { useUserProgression } from '../hooks/useUserProgression';
import { useBadgeProgress } from '../hooks/useBadgeProgress';
import {
  canCreateCollections,
  getExplorerVisitProgress,
  resolveUnlockBadge,
  showCollectionsLockedToast,
} from '../utils/collectionAccess';
import { useLocation } from '../hooks/useLocation';
import { useSpotVibes } from '../hooks/useSpotVibes';
import {
  getNearbySpots,
  getSpotById,
  shareSpot as recordShare,
} from '../services/spots.service';
import { getMyReviews } from '../services/user.service';
import { getSpotComments } from '../services/comments.service';
import {
  isSpotSaved,
  saveSpot,
  unsaveSpot,
} from '../services/savedSpots.service';
import {
  isSpotVisited,
  markSpotAsVisited,
} from '../services/visitedSpots.service';
import {
  openStatus,
  prettyCategory,
  vibeForCategory,
} from '../utils/spotHelpers';
import { normalizeHoursFromSpot, HOURS_DAYS } from '../utils/hoursHelpers';
import { resolveAmenities } from '../utils/amenities';
import { distanceKmFromUser, kmToMiles, walkingMinutes } from '../utils/geo';
import { tryNavigateToWriteReview } from '../utils/reviewAccess';
import {
  markEditorsChallengeCelebrated,
  wasEditorsChallengeCelebrated,
} from '../utils/editorsChallengeStorage';

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = 520;
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/* ─────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function safeArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  if (Array.isArray(maybe?.comments)) return maybe.comments;
  if (Array.isArray(maybe?.items)) return maybe.items;
  if (Array.isArray(maybe?.data)) return maybe.data;
  if (Array.isArray(maybe?.reviews)) return maybe.reviews;
  return [];
}

function reviewSpotId(review) {
  return review?.spotId ?? review?.spot?.id ?? review?.spot_id ?? null;
}

function reviewUserId(review) {
  return review?.userId ?? review?.user?.id ?? review?.user_id ?? null;
}

function extractCoords(spot) {
  if (!spot) return null;
  const lat =
    spot.latitude ?? spot.lat ?? spot.location?.latitude ?? spot.location?.lat;
  const lng =
    spot.longitude ?? spot.lng ?? spot.location?.longitude ?? spot.location?.lng;
  if (lat == null || lng == null) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

function priceSymbol(spot) {
  // Accepts spot.priceRange / .price as 0–4 ints or strings.
  // 0 = FREE, 1..4 = € repeats.
  const raw = spot?.priceRange ?? spot?.price ?? spot?.priceTier;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (Number.isFinite(n)) {
    if (n <= 0) return 'FREE';
    return '€'.repeat(Math.min(4, Math.max(1, Math.round(n))));
  }
  if (typeof raw === 'string') return raw.toUpperCase();
  return null;
}

function spotImages(spot) {
  const imgs = Array.isArray(spot?.images) ? spot.images.filter(Boolean) : [];
  if (imgs.length) return imgs;
  if (spot?.thumbnail) return [spot.thumbnail];
  if (spot?.coverImage) return [spot.coverImage];
  return [];
}

function topVibesDisplay(vibes) {
  if (!Array.isArray(vibes) || !vibes.length) return '';
  const sorted = [...vibes].sort((a, b) => (b?.count || 0) - (a?.count || 0));
  return sorted
    .slice(0, 3)
    .map((v) => String(v?.name || v?.label || v?.id || '').trim())
    .filter(Boolean)
    .join(' · ');
}

function formatMi(km) {
  if (km == null) return null;
  const miles = kmToMiles(km);
  if (miles < 0.1) return '< 0.1 mi';
  return `${miles.toFixed(1)} mi`;
}

function formatWalkEyebrow(km, walkMin) {
  const mi = formatMi(km);
  if (mi && walkMin != null) return `${mi} · ${walkMin} min walk`;
  if (mi) return mi;
  if (walkMin != null) return `${walkMin} min walk`;
  return 'Location';
}

function isChampionSpot(spot) {
  return !!(
    spot?.isWeeklyChampion ||
    spot?.weeklyChampion ||
    spot?.championWeek != null ||
    spot?.isChampion
  );
}

function buildVibeHook(spot, tags, vibeSummary) {
  if (Array.isArray(tags) && tags.length) {
    const first = String(tags[0]);
    const rest = tags.slice(1, 3).map(String).join(' · ');
    return { highlight: first, rest: rest ? ` · ${rest}` : '' };
  }
  if (vibeSummary) {
    const parts = vibeSummary.split(' · ');
    if (parts.length > 1) {
      return { highlight: parts[0], rest: ` · ${parts.slice(1).join(' · ')}` };
    }
    return { highlight: vibeSummary, rest: '' };
  }
  const desc = spot?.description || spot?.blurb || '';
  const sentence = desc.split(/[.!?]/)[0]?.trim();
  if (sentence && sentence.length <= 80) {
    return { highlight: sentence, rest: '' };
  }
  return null;
}

function buildSubtitleLine(spot, tags, vibeSummary, walkMin) {
  const parts = [];
  if (Array.isArray(tags) && tags.length) {
    parts.push(...tags.slice(0, 3).map(String));
  } else if (vibeSummary) {
    parts.push(...vibeSummary.split(' · '));
  } else if (spot?.hook) {
    parts.push(String(spot.hook));
  }
  return {
    main: parts.join(' · '),
    walk: walkMin != null ? `${walkMin} min walk` : null,
  };
}

function pickSocialField(spot, keys = []) {
  for (const key of keys) {
    const value = spot?.[key];
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  PRIMITIVES                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function SectionEyebrow({ children }) {
  return <Text style={styles.sectionEyebrow}>{children}</Text>;
}

function SectionHeading({ children, style }) {
  return <Text style={[styles.sectionHeading, style]}>{children}</Text>;
}

function TitleChip({ children, variant = 'default' }) {
  return (
    <View
      style={[
        styles.titleChip,
        variant === 'open' && styles.titleChipOpen,
        variant === 'trend' && styles.titleChipTrend,
      ]}
    >
      {variant === 'open' ? <View style={styles.titleChipOpenDot} /> : null}
      <Text
        style={[
          styles.titleChipText,
          variant === 'open' && styles.titleChipTextOpen,
          variant === 'trend' && styles.titleChipTextTrend,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

function HeroBadge({ children, variant = 'default', pulse = false }) {
  return (
    <View
      style={[
        styles.heroBadge,
        variant === 'champion' && styles.heroBadgeChampion,
        variant === 'moss' && styles.heroBadgeMoss,
      ]}
    >
      {pulse ? (
        <LivePulseDot color={fieldGuide.ember} size={6} />
      ) : variant === 'moss' ? (
        <View style={styles.heroBadgeMossDot} />
      ) : null}
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.heroBadgeText,
            variant === 'champion' && styles.heroBadgeTextChampion,
            variant === 'moss' && styles.heroBadgeTextMoss,
          ]}
        >
          {children}
        </Text>
      ) : (
        <View style={styles.heroBadgeRow}>{children}</View>
      )}
    </View>
  );
}

function SimilarSpotCard({ item, onPress, userLocation }) {
  const km = userLocation ? distanceKmFromUser(userLocation, item) : null;
  const dist = km != null ? formatMi(km) : null;
  const rating = Number(item?.ratingAvg ?? item?.rating ?? 0);
  const imageUri =
    item?.thumbnail ||
    (Array.isArray(item?.images) && item.images[0]) ||
    null;
  const vibe = vibeForCategory(item?.category);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.similarCard,
        { opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={styles.similarPhoto}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} />
        ) : (
          <DuotoneVibe vibe={vibe} style={StyleSheet.absoluteFill} />
        )}
        {dist ? (
          <View style={styles.similarDist}>
            <Text style={styles.similarDistText}>{dist}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.similarTitle} numberOfLines={2}>
        {item?.title || item?.name || 'Spot'}
      </Text>
      <Text style={styles.similarMeta} numberOfLines={1}>
        {rating > 0 ? (
          <Text style={styles.similarRating}>{rating.toFixed(1)}</Text>
        ) : null}
        {rating > 0 ? ' · ' : ''}
        {prettyCategory(item?.category) || 'Spot'}
        {item?.district || item?.city
          ? ` · ${item.district || item.city}`
          : ''}
      </Text>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  CONTACT ROW                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function ContactRow({ icon, label, value, onPress }) {
  if (!value) return null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.contactRow,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.contactIc}>
        <Ionicons name={icon} size={14} color={fieldGuide.cream} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.contactValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Text style={styles.contactArrow}>↗</Text>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  ACTION CELL                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function ActionCell({ icon, label, onPress, primary = false }) {
  const tint = primary ? '#FFF8F1' : fieldGuide.cream;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.action,
        primary && styles.actionPrimary,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Ionicons name={icon} size={16} color={tint} />
      <Text style={[styles.actionLabel, { color: tint }]}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SCREEN                                                             */
/* ─────────────────────────────────────────────────────────────────── */

export const SpotDetailScreen = ({ navigation, route }) => {
  const spotId = route?.params?.spotId ?? route?.params?.id;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user } = useAuth();
  const { data: progression } = useUserProgression();
  const unlockedCreate = canCreateCollections(user, progression);
  const unlockBadge = resolveUnlockBadge(user, progression);
  const { data: badgeProgress } = useBadgeProgress({ enabled: !unlockedCreate });
  const { location: userLocation } = useLocation();

  const handleCreatePocket = useCallback(() => {
    if (unlockedCreate) {
      navigation.navigate('CreateCollection');
      return;
    }
    const progress = getExplorerVisitProgress(progression, badgeProgress, unlockBadge);
    showCollectionsLockedToast(toast, unlockBadge, progress);
  }, [unlockedCreate, navigation, progression, badgeProgress, unlockBadge, toast]);

  /* ── queries ─────────────────────────────────────────────────────── */
  const spotQuery = useQuery({
    queryKey: ['spot', spotId],
    queryFn: () => getSpotById(spotId),
    enabled: !!spotId,
  });
  const spot = spotQuery.data && !spotQuery.data.error ? spotQuery.data : null;

  const { data: spotVibes } = useSpotVibes(spotId);

  const commentsQuery = useQuery({
    queryKey: ['spot-comments', spotId, 'preview'],
    queryFn: () => getSpotComments(spotId, 1, 3),
    enabled: !!spotId,
  });
  const reviewsPayload = commentsQuery.data;
  const reviews = useMemo(
    () => safeArray(reviewsPayload?.comments ?? reviewsPayload),
    [reviewsPayload],
  );

  const myReviewsQuery = useQuery({
    queryKey: ['my-reviews', user?.id],
    queryFn: getMyReviews,
    enabled: !!user?.id && !!spotId,
  });

  /* ── saved state ─────────────────────────────────────────────────── */
  const [saved, setSaved] = useState(false);
  const refreshSaved = useCallback(async () => {
    if (!spotId) return;
    try {
      const result = await isSpotSaved(spotId);
      setSaved(!!result);
    } catch (err) {
      logger.error('SpotDetail.isSpotSaved', err);
    }
  }, [spotId]);
  useFocusEffect(
    useCallback(() => {
      refreshSaved();
    }, [refreshSaved]),
  );

  const [visited, setVisited] = useState(false);
  const [visitBusy, setVisitBusy] = useState(false);

  const refreshVisited = useCallback(async () => {
    if (!spotId) return;
    try {
      const v = await isSpotVisited(spotId);
      setVisited(!!v);
    } catch (err) {
      logger.error('SpotDetail.isSpotVisited', err);
    }
  }, [spotId]);

  useFocusEffect(
    useCallback(() => {
      refreshVisited();
      if (user?.id && spotId) {
        myReviewsQuery.refetch();
        commentsQuery.refetch();
      }
    }, [refreshVisited, user?.id, spotId, myReviewsQuery, commentsQuery]),
  );

  const toggleSave = useCallback(async () => {
    if (!spotId) return;
    const next = !saved;
    setSaved(next);
    try {
      const result = await (next ? saveSpot(spotId) : unsaveSpot(spotId));
      if (result?.error) throw new Error(result.error);
      toast.show(next ? 'Saved to pocket.' : 'Removed from pocket.', {
        variant: 'success',
      });
      if (next) {
        track(Events.SPOT_SAVED, { spot_id: spotId });
      }
    } catch (err) {
      logger.error('SpotDetail.toggleSave', err);
      setSaved(!next);
      toast.show('Could not update your pocket.', { variant: 'error' });
    }
  }, [spotId, saved, toast]);

  const [refreshing, setRefreshing] = useState(false);

  /* ── pagination of hero ──────────────────────────────────────────── */
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef(null);

  /* ── derived: similar spots ──────────────────────────────────────── */
  const coords = extractCoords(spot);
  const similarQuery = useQuery({
    queryKey: ['similar-spots', spotId, coords?.lat, coords?.lng, spot?.category],
    queryFn: async () => {
      if (!coords) return [];
      const data = await getNearbySpots(coords.lat, coords.lng, 5000);
      const arr = safeArray(data);
      const sameCat = arr.filter(
        (s) => s?.id !== spotId && (!spot?.category || s?.category === spot.category),
      );
      const fallback = arr.filter((s) => s?.id !== spotId);
      return (sameCat.length ? sameCat : fallback).slice(0, 10);
    },
    enabled: !!coords,
  });
  const similar = safeArray(similarQuery.data);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        spotQuery.refetch(),
        commentsQuery.refetch(),
        myReviewsQuery.refetch(),
        similarQuery.refetch(),
        refreshSaved(),
        refreshVisited(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [spotQuery, commentsQuery, myReviewsQuery, similarQuery, refreshSaved, refreshVisited]);

  /* ── distance + walking minutes ──────────────────────────────────── */
  const distanceKm = useMemo(() => {
    if (!coords || !userLocation) return null;
    return distanceKmFromUser(userLocation, {
      latitude: coords.lat,
      longitude: coords.lng,
    });
  }, [coords, userLocation]);
  const walkMin = useMemo(() => walkingMinutes(distanceKm), [distanceKm]);
  const distanceMi = useMemo(() => formatMi(distanceKm), [distanceKm]);
  const walkEyebrow = useMemo(
    () => formatWalkEyebrow(distanceKm, walkMin),
    [distanceKm, walkMin],
  );

  /* ── action handlers ─────────────────────────────────────────────── */
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [challengeCongrats, setChallengeCongrats] = useState(null);

  const handleShare = useCallback(() => {
    if (!spot) return;
    setShareOpen(true);
  }, [spot]);

  const handleShareRecorded = useCallback(() => {
    if (spotId) recordShare(spotId).catch(() => {});
  }, [spotId]);

  const openDirections = useCallback(async () => {
    if (!coords) {
      toast.show('No location for this spot yet.', { variant: 'info' });
      return;
    }
    const url = `https://maps.google.com/?daddr=${coords.lat},${coords.lng}`;
    try {
      await Linking.openURL(url);
      track(Events.DIRECTIONS_OPENED, { spot_id: spotId });
    } catch (err) {
      logger.error('SpotDetail.directions', err);
      toast.show('Could not open maps.', { variant: 'error' });
    }
  }, [coords, toast, spotId]);

  const handleMarkVisit = useCallback(async () => {
    if (!spotId || visited || visitBusy) return;
    setVisitBusy(true);
    try {
      const result = await markSpotAsVisited(spotId, {
        lat: userLocation?.latitude,
        lng: userLocation?.longitude,
      });
      if (result?.error) throw new Error(result.error);
      setVisited(true);
      track(Events.SPOT_VISIT_STAMPED, { spot_id: spotId });
      toast.show("Stamped — you've been here.", { variant: 'success' });

      if (result?.editorsPickChallengeCompleted) {
        const key = result.challengeKey;
        const seen = key ? await wasEditorsChallengeCelebrated(key) : true;
        if (!seen) {
          setChallengeCongrats({
            challengeKey: key,
            bonusXp: result.bonusXp ?? 50,
          });
          track(Events.EDITORS_PICK_CHALLENGE_COMPLETED, {
            challenge_key: key,
            bonus_xp: result.bonusXp ?? 50,
            source: 'spot_detail',
          });
        }
      }
    } catch (err) {
      logger.error('SpotDetail.markVisit', err);
      toast.show('Could not stamp this visit.', { variant: 'error' });
    } finally {
      setVisitBusy(false);
    }
  }, [spotId, visited, visitBusy, userLocation, toast]);

  const dismissChallengeCongrats = useCallback(async () => {
    if (challengeCongrats?.challengeKey) {
      await markEditorsChallengeCelebrated(challengeCongrats.challengeKey);
    }
    setChallengeCongrats(null);
  }, [challengeCongrats?.challengeKey]);

  const handleWriteReview = useCallback(() => {
    track(Events.REVIEW_STARTED, { spot_id: spotId });
    tryNavigateToWriteReview({
      navigation,
      spotId,
      visited,
      toast,
      user,
    });
  }, [navigation, spotId, visited, toast, user]);

  const handleSignInForVisit = useCallback(() => {
    toast.show('Sign in to stamp your visit.', { variant: 'info' });
    navigation.navigate('SignIn');
  }, [navigation, toast]);

  const openExternal = useCallback(async (url) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else toast.show('Nothing handles this link.', { variant: 'info' });
    } catch (err) {
      logger.error('SpotDetail.openExternal', err);
    }
  }, [toast]);

  const onMomentumScrollEnd = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    setHeroIndex(Math.round(x / SCREEN_W));
  }, []);

  const userHasReviewed = useMemo(() => {
    if (!user?.id || !spotId) return false;
    const uid = String(user.id);
    const sid = String(spotId);

    const inPreview = reviews.some((r) => {
      const authorId = reviewUserId(r);
      if (authorId == null) return false;
      const rid = reviewSpotId(r);
      return String(authorId) === uid && (rid == null || String(rid) === sid);
    });
    if (inPreview) return true;

    const myReviews = safeArray(myReviewsQuery.data);
    return myReviews.some((r) => {
      const rid = reviewSpotId(r);
      return rid != null && String(rid) === sid;
    });
  }, [user?.id, spotId, reviews, myReviewsQuery.data]);

  useEffect(() => {
    const payload = spotQuery.data;
    if (!spotId || !payload || payload.error) return;
    track(Events.SPOT_VIEWED, {
      spot_id: spotId,
      category: payload.category,
    });
  }, [spotId, spotQuery.data]);

  /* ── render guards ───────────────────────────────────────────────── */
  if (!spotId) {
    return (
      <View style={[styles.fillCenter, { paddingTop: insets.top }]}>
        <EmptyState
          title="No spot selected."
          body="Tap a spot from Home, Explore or Map to open it here."
          cta={{ label: 'Back', onPress: () => navigation.goBack() }}
        />
      </View>
    );
  }
  if (spotQuery.isLoading && !spot) {
    return (
      <View style={styles.fillCenter}>
        <ActivityIndicator color={fieldGuide.ember} />
      </View>
    );
  }
  if (spotQuery.isError || !spot) {
    return (
      <View style={[styles.fillCenter, { paddingTop: insets.top }]}>
        <EmptyState
          title="Couldn’t open this spot."
          italic="this spot."
          body="The link might be stale, or the spot was taken down. Try again or head back."
          cta={{ label: 'Back', onPress: () => navigation.goBack() }}
        />
      </View>
    );
  }

  /* ── derived ─────────────────────────────────────────────────────── */
  const images = spotImages(spot);
  const status = openStatus(spot);
  const price = priceSymbol(spot);
  const vibe = vibeForCategory(spot.category);
  const todayKey = DAY_KEYS[new Date().getDay()];
  const displayHours = normalizeHoursFromSpot(spot.hours);
  const hasHours = HOURS_DAYS.some((d) => displayHours[d] != null);
  const vibeSummary = topVibesDisplay(spotVibes);
  const tags = Array.isArray(spot.tags) ? spot.tags.filter(Boolean) : [];
  const vibeHook = buildVibeHook(spot, tags, vibeSummary);
  const subtitle = buildSubtitleLine(spot, tags, vibeSummary, walkMin);
  const champion = isChampionSpot(spot);
  const isTrending = !!(spot.trending || spot.isTrending || spot.rankDelta > 0);
  const savesTrend = Number(
    spot.savedCount ?? spot.saveCount ?? spot.savesThisWeek ?? 0,
  );
  const avgRating = Number(spot.ratingAvg ?? spot.averageRating ?? spot.rating ?? 0);
  const reviewsTotalFromMeta = Number(reviewsPayload?.meta?.total ?? 0);
  const reviewCount = Number(
    spot.ratingCount ??
      spot.reviewCount ??
      spot.commentCount ??
      reviewsTotalFromMeta ??
      reviews.length ??
      0,
  );
  const bestTimeValue = spot.bestTime || spot.best_visit_time || null;
  const amenities = resolveAmenities(spot.features || spot.amenities);

  const renderBottomSecondary = () => {
    if (!user) {
      return (
        <VisitStampButton
          variant="cta"
          disabled
          onDisabledPress={handleSignInForVisit}
          onVisit={handleMarkVisit}
          busy={visitBusy}
        />
      );
    }
    if (!visited) {
      return (
        <VisitStampButton
          variant="cta"
          onVisit={handleMarkVisit}
          busy={visitBusy}
        />
      );
    }
    if (!userHasReviewed) {
      return (
        <Pressable
          onPress={handleWriteReview}
          accessibilityRole="button"
          accessibilityLabel="Write a review"
          style={({ pressed }) => [
            styles.ctaIconBtn,
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Ionicons name="star-outline" size={16} color={fieldGuide.ink} />
        </Pressable>
      );
    }
    return (
      <Pressable
        onPress={handleShare}
        accessibilityRole="button"
        accessibilityLabel="Share spot"
        style={({ pressed }) => [
          styles.ctaIconBtn,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Ionicons name="share-outline" size={16} color={fieldGuide.ink} />
      </Pressable>
    );
  };

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={fieldGuide.ember}
            colors={[fieldGuide.ember]}
          />
        }
      >
        {/* HERO */}
        <View style={styles.hero}>
          {images.length > 0 ? (
            <FlatList
              ref={heroRef}
              data={images}
              keyExtractor={(uri, i) => `${uri}-${i}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumScrollEnd}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() =>
                    navigation.navigate('PhotoViewer', { spotId, index })
                  }
                  style={styles.heroImageWrap}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
            />
          ) : (
            <DuotoneVibe vibe={vibe} style={StyleSheet.absoluteFill} />
          )}

          <LinearGradient
            colors={[
              'rgba(20,22,29,0.45)',
              'rgba(20,22,29,0)',
              'rgba(20,22,29,0)',
              fieldGuide.ink,
            ]}
            locations={[0, 0.18, 0.6, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* nav-top */}
          <View
            style={[styles.navTop, { top: insets.top + 10 }]}
            pointerEvents="box-none"
          >
            <IconSquare
              onPress={() => navigation.goBack()}
              accessibilityLabel="Back"
              size={38}
              radius={19}
            >
              <Ionicons name="chevron-back" size={16} color={fieldGuide.cream} />
            </IconSquare>
            <View style={styles.navTopRight}>
              <Pressable
                onPress={toggleSave}
                onLongPress={() => setPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={saved ? 'Saved' : 'Save spot'}
              >
                <View style={styles.navGlassBtn}>
                  <Ionicons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={16}
                    color={saved ? fieldGuide.ember : fieldGuide.cream}
                  />
                </View>
              </Pressable>
              <IconSquare
                onPress={handleShare}
                accessibilityLabel="Share"
                size={38}
                radius={19}
              >
                <Ionicons name="share-outline" size={16} color={fieldGuide.cream} />
              </IconSquare>
              <IconSquare
                onPress={() =>
                  toast.show('More options coming soon.', { variant: 'info' })
                }
                accessibilityLabel="More"
                size={38}
                radius={19}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color={fieldGuide.cream}
                />
              </IconSquare>
            </View>
          </View>

          {images.length > 0 ? (
            <View style={styles.heroCount}>
              <Ionicons name="images-outline" size={12} color={fieldGuide.cream} />
              <Text style={styles.heroCountText}>
                {`${heroIndex + 1} / ${images.length}`}
              </Text>
            </View>
          ) : null}

          <View style={styles.heroBadges}>
            {champion ? (
              <HeroBadge variant="champion" pulse>
                Week&apos;s top spot
              </HeroBadge>
            ) : null}
            {distanceMi ? (
              <HeroBadge>
                <Ionicons name="location" size={12} color={fieldGuide.cream} />
                <Text style={styles.heroBadgeText}>{distanceMi}</Text>
              </HeroBadge>
            ) : null}
            {status.isOpen === true ? (
              <HeroBadge variant="moss">Open now</HeroBadge>
            ) : null}
          </View>
        </View>

        {/* TITLE BLOCK */}
        <View style={styles.titleBlock}>
          <View style={styles.titleChips}>
            {prettyCategory(spot.category) ? (
              <TitleChip>{prettyCategory(spot.category)}</TitleChip>
            ) : null}
            {spot.district || spot.city ? (
              <TitleChip>{spot.district || spot.city}</TitleChip>
            ) : null}
            {price ? <TitleChip>{price}</TitleChip> : null}
            {isTrending ? (
              <TitleChip variant="trend">↑ Trending</TitleChip>
            ) : null}
          </View>
          <Text style={styles.spotTitle}>{spot.title}</Text>
          {subtitle.main || subtitle.walk ? (
            <Text style={styles.spotSub}>
              {subtitle.main}
              {subtitle.walk ? (
                <Text style={styles.spotSubMuted}> · {subtitle.walk}</Text>
              ) : null}
            </Text>
          ) : null}
        </View>

        {/* RATING ROW */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingBig}>
              {(avgRating > 0 ? avgRating : 0).toFixed(1)}
              <Text style={styles.ratingSmall}>/5</Text>
            </Text>
            <Text style={styles.reviewCountLabel}>
              {`${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
            </Text>
          </View>
          <View style={styles.dotsBlock}>
            <RatingDots value={avgRating || 0} showNumber={false} size="sm" />
            {vibeSummary ? (
              <Text style={styles.vibeSummaryLabel}>{vibeSummary}</Text>
            ) : null}
            {savesTrend > 0 ? (
              <View style={styles.savesTrendPill}>
                <Text style={styles.savesTrendText}>
                  {`↑ ${savesTrend} saves this week`}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsGrid}>
          <ActionCell
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label={saved ? 'Saved' : 'Save'}
            onPress={toggleSave}
            primary={saved}
          />
          <ActionCell
            icon="navigate-outline"
            label="Directions"
            onPress={openDirections}
          />
          {!userHasReviewed ? (
            <ActionCell
              icon="share-outline"
              label="Share"
              onPress={handleShare}
            />
          ) : null}
        </View>

        {/* STORY */}
        {(vibeHook || spot.description) ? (
          <View style={styles.storySection}>
            {vibeHook ? (
              <Text style={styles.vibeHook}>
                <Text style={styles.vibeHookEm}>{vibeHook.highlight}</Text>
                {vibeHook.rest}
              </Text>
            ) : null}
            {spot.description ? (
              <Text style={styles.storyBody}>{spot.description}</Text>
            ) : null}
          </View>
        ) : null}

        {/* SERVICES & AMENITIES */}
        {amenities.length ? (
          <View style={styles.section}>
            <SectionEyebrow>Services</SectionEyebrow>
            <SectionHeading>What you’ll find here</SectionHeading>
            <View style={styles.amenityGrid}>
              {amenities.map((a) => (
                <View key={a.key} style={styles.amenityItem}>
                  <View style={styles.amenityIcon}>
                    <Ionicons name={a.icon} size={15} color={fieldGuide.emberSoft} />
                  </View>
                  <Text style={styles.amenityLabel} numberOfLines={2}>
                    {a.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* HOURS */}
        <View style={styles.section}>
          <SectionEyebrow>Hours</SectionEyebrow>
          <SectionHeading>Best time to visit</SectionHeading>
          {bestTimeValue ? (
            <Text style={styles.bestTimeNote}>{bestTimeValue}</Text>
          ) : null}
          {hasHours ? (
            <View style={{ marginTop: 14 }}>
              <HourBarChart hours={displayHours} today={todayKey} />
            </View>
          ) : (
            <Text style={styles.hoursMissing}>
              Hours not listed yet — check back soon.
            </Text>
          )}
        </View>

        {/* LOCATION */}
        <View style={styles.section}>
          <SectionEyebrow>{walkEyebrow}</SectionEyebrow>
          <SectionHeading>
            {spot.address || 'Address coming soon'}
          </SectionHeading>
          <View style={styles.miniMapWrap}>
            <MiniMap
              location={
                coords ? { lat: coords.lat, lng: coords.lng } : undefined
              }
              drawn={!coords}
              onPress={coords ? openDirections : undefined}
              style={styles.miniMap}
            />
          </View>
          <ContactList
            spot={spot}
            onOpen={openExternal}
            onMaps={openDirections}
          />
        </View>

        {/* REVIEWS PREVIEW */}
        <View style={styles.section}>
          <View style={styles.reviewsHead}>
            <View>
              <SectionEyebrow>
                {`${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
              </SectionEyebrow>
              <SectionHeading>Recent visits</SectionHeading>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Reviews', { spotId })}
              hitSlop={8}
            >
              <Text style={styles.allLink}>All reviews →</Text>
            </Pressable>
          </View>

          {commentsQuery.isLoading ? (
            <View style={{ paddingVertical: 24 }}>
              <ActivityIndicator color={fieldGuide.ember} />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.reviewsEmpty}>
              <EmptyState
                title="No reviews yet."
                body="Be the first to share what this spot is like."
                cta={{
                  label: 'Write a review',
                  onPress: handleWriteReview,
                }}
              />
            </View>
          ) : (
            <View style={{ marginTop: 4 }}>
              {reviews.slice(0, 2).map((r, i) => (
                <ReviewRow key={String(r?.id || i)} review={r} />
              ))}
            </View>
          )}
        </View>

        {/* SIMILAR */}
        <View style={styles.similarSection}>
          <View style={styles.similarHead}>
            <SectionEyebrow>Nearby</SectionEyebrow>
            <SectionHeading>More like this</SectionHeading>
          </View>
          {similarQuery.isLoading ? (
            <View style={{ paddingVertical: 24, paddingHorizontal: 22 }}>
              <ActivityIndicator color={fieldGuide.ember} />
            </View>
          ) : similar.length === 0 ? (
            <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
              <Text style={styles.similarEmpty}>
                Nothing nearby with the same vibe yet — pull up the map to wander.
              </Text>
            </View>
          ) : (
            <FlatList
              data={similar}
              keyExtractor={(item, i) => String(item?.id || i)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarList}
              renderItem={({ item }) => (
                <SimilarSpotCard
                  item={item}
                  userLocation={userLocation}
                  onPress={() =>
                    navigation.push('SpotDetail', { spotId: item?.id })
                  }
                />
              )}
              ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
            />
          )}
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* STICKY BOTTOM CTA */}
      <View pointerEvents="box-none" style={styles.ctaWrap}>
        <LinearGradient
          colors={['transparent', fieldGuide.ink]}
          locations={[0, 0.3]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View
          style={[styles.ctaRow, { paddingBottom: insets.bottom + 4 }]}
        >
          <EditorialButton
            variant="primary"
            size="md"
            leading={
              <Ionicons name="navigate-outline" size={14} color="#FFF8F1" />
            }
            onPress={openDirections}
            style={styles.ctaWalk}
          >
            {walkMin != null
              ? `Walk there · ${walkMin} min`
              : 'Get directions'}
          </EditorialButton>
          {renderBottomSecondary()}
        </View>
      </View>

      <CollectionPickerSheet
        visible={pickerOpen}
        spotId={spotId}
        onClose={() => setPickerOpen(false)}
        onCreateNew={handleCreatePocket}
      />

      <ShareDispatchSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        variant="spot"
        spot={spot}
        spotId={spotId}
        topVibes={spotVibes || []}
        walkMin={walkMin}
        userName={user?.name || user?.displayName || ''}
        onShared={handleShareRecorded}
      />

      <EditorsPickCompleteModal
        visible={!!challengeCongrats}
        bonusXp={challengeCongrats?.bonusXp ?? 50}
        onDismiss={dismissChallengeCongrats}
      />
    </View>
  );
};

export default SpotDetailScreen;

/* ─────────────────────────────────────────────────────────────────── */
/*  CONTACT LIST                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function ContactList({ spot, onOpen, onMaps }) {
  const website = pickSocialField(spot, ['website', 'websiteUrl', 'siteUrl']);
  const instagram = pickSocialField(spot, ['instagram', 'instagramUrl', 'ig']);
  const facebook = pickSocialField(spot, ['facebook', 'facebookUrl']);
  const twitter = pickSocialField(spot, ['twitter', 'twitterUrl', 'x', 'xUrl']);
  const phone = pickSocialField(spot, ['phone', 'ownerPhone']);
  const email = pickSocialField(spot, ['email', 'ownerContact']);

  const rows = [
    spot.address && {
      icon: 'location-outline',
      label: 'Address',
      value: spot.address,
      onPress: onMaps,
    },
    website && {
      icon: 'globe-outline',
      label: 'Website',
      value: String(website).replace(/^https?:\/\//, ''),
      onPress: () =>
        onOpen(
          website.startsWith('http')
            ? website
            : `https://${website}`,
        ),
    },
    instagram && {
      icon: 'logo-instagram',
      label: 'Instagram',
      value: instagram.startsWith('@')
        ? instagram
        : `@${instagram}`,
      onPress: () =>
        onOpen(
          `https://instagram.com/${String(instagram).replace('@', '')}`,
        ),
    },
    facebook && {
      icon: 'logo-facebook',
      label: 'Facebook',
      value: facebook,
      onPress: () =>
        onOpen(`https://facebook.com/${String(facebook).replace('@', '')}`),
    },
    twitter && {
      icon: 'logo-twitter',
      label: 'Twitter',
      value: twitter.startsWith('@')
        ? twitter
        : `@${twitter}`,
      onPress: () =>
        onOpen(`https://twitter.com/${String(twitter).replace('@', '')}`),
    },
    phone && {
      icon: 'call-outline',
      label: 'Phone',
      value: phone,
      onPress: () => onOpen(`tel:${String(phone).replace(/\s+/g, '')}`),
    },
    email && {
      icon: 'mail-outline',
      label: 'Email',
      value: email,
      onPress: () => onOpen(`mailto:${email}`),
    },
  ].filter(Boolean);

  if (rows.length === 0) {
    return (
      <Text style={styles.contactFallback}>
        {`No contact details yet — ask the editors at ${BRAND.supportEmail}.`}
      </Text>
    );
  }

  return (
    <View style={styles.contactList}>
      {rows.map((row, i) => (
        <ContactRow key={`${row.label}-${i}`} {...row} />
      ))}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  STYLES                                                              */
/* ─────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  fillCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: fieldGuide.ink,
  },
  scrollContent: {
    paddingBottom: 130,
  },

  /* hero */
  hero: {
    width: '100%',
    height: HERO_H,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImageWrap: {
    width: SCREEN_W,
    height: HERO_H,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  navTop: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  navTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navGlassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,22,29,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,239,230,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadges: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 110,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    zIndex: 9,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: 'rgba(20,22,29,0.62)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,239,230,0.16)',
  },
  heroBadgeChampion: {
    backgroundColor: 'rgba(232,116,58,0.22)',
    borderColor: 'rgba(232,116,58,0.4)',
  },
  heroBadgeMoss: {},
  heroBadgeMossDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: fieldGuide.moss,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 11,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  heroBadgeTextChampion: {
    color: fieldGuide.emberSoft,
  },
  heroBadgeTextMoss: {
    color: fieldGuide.moss,
  },
  heroCount: {
    position: 'absolute',
    right: 22,
    bottom: 110,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: 'rgba(20,22,29,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,239,230,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 9,
  },
  heroCountText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wide(10),
    color: 'rgba(244,239,230,0.85)',
  },

  /* title block */
  titleBlock: {
    marginTop: -72,
    paddingHorizontal: 22,
    zIndex: 2,
    position: 'relative',
  },
  titleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  titleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: fieldGuide.inkElev,
  },
  titleChipOpen: {
    borderColor: 'rgba(122,155,106,0.35)',
  },
  titleChipTrend: {
    borderColor: 'rgba(201,162,75,0.35)',
  },
  titleChipOpenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: fieldGuide.moss,
  },
  titleChipText: {
    fontFamily: fieldGuide.fonts.sansMedium,
    fontSize: 11,
    color: fieldGuide.creamSoft,
    includeFontPadding: false,
  },
  titleChipTextOpen: {
    color: fieldGuide.moss,
  },
  titleChipTextTrend: {
    color: fieldGuide.gold,
  },
  spotTitle: {
    marginTop: 12,
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 34,
    lineHeight: Math.round(34 * 1.05),
    letterSpacing: -0.02 * 34,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  spotSub: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: Math.round(14 * 1.45),
    color: fieldGuide.creamSoft,
    includeFontPadding: false,
  },
  spotSubMuted: {
    color: fieldGuide.creamMute,
  },

  /* rating row */
  ratingRow: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  ratingLeft: {
    flexShrink: 1,
    minWidth: 0,
  },
  ratingBig: {
    fontFamily: fieldGuide.fonts.display,
    fontSize: 23,
    lineHeight: 26,
    color: fieldGuide.creamSoft,
    letterSpacing: -0.01 * 23,
    includeFontPadding: false,
  },
  ratingSmall: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    color: fieldGuide.creamMute,
  },
  reviewCountLabel: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 11,
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  dotsBlock: {
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '52%',
  },
  vibeSummaryLabel: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    color: fieldGuide.creamMute,
    textAlign: 'right',
    includeFontPadding: false,
  },
  savesTrendPill: {
    marginTop: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: 'rgba(122,155,106,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(122,155,106,0.28)',
  },
  savesTrendText: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 11,
    color: fieldGuide.moss,
    includeFontPadding: false,
  },

  /* actions */
  actionsGrid: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  action: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionPrimary: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  actionLabel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.widest(9),
  },

  /* shared section */
  section: {
    paddingHorizontal: 22,
    paddingVertical: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  sectionEyebrow: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 12,
    color: fieldGuide.creamMute,
    marginBottom: 4,
    includeFontPadding: false,
  },
  sectionHeading: {
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 18,
    letterSpacing: -0.005 * 18,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  storySection: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  vibeHook: {
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 16,
    lineHeight: Math.round(16 * 1.35),
    letterSpacing: -0.01 * 16,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  vibeHookEm: {
    color: fieldGuide.emberSoft,
  },
  storyBody: {
    marginTop: 10,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: Math.round(14 * 1.55),
    color: fieldGuide.creamSoft,
    includeFontPadding: false,
  },

  /* services & amenities */
  amenityGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingRight: 10,
  },
  amenityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,116,58,0.12)',
  },
  amenityLabel: {
    flex: 1,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13.5,
    color: fieldGuide.creamSoft,
    includeFontPadding: false,
  },

  /* hours fallback */
  hoursMissing: {
    marginTop: 12,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    color: fieldGuide.creamMute,
    lineHeight: 22,
  },
  bestTimeNote: {
    marginTop: 10,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13.5,
    color: fieldGuide.creamSoft,
    lineHeight: 20,
  },
  bestTimeNoteMuted: {
    marginTop: 10,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    color: fieldGuide.creamMute,
    lineHeight: 19,
  },

  /* location */
  miniMapWrap: {
    marginTop: 14,
    marginBottom: 18,
  },
  miniMap: {
    aspectRatio: 16 / 10,
  },
  contactList: {
    flexDirection: 'column',
    gap: 0,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    gap: 14,
  },
  contactIc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.widest(9),
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  contactValue: {
    marginTop: 2,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13.5,
    color: fieldGuide.cream,
  },
  contactArrow: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 14,
    color: fieldGuide.creamMute,
  },
  contactFallback: {
    marginTop: 12,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    color: fieldGuide.creamMute,
    lineHeight: 22,
  },

  /* reviews */
  reviewsHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  allLink: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 13,
    color: fieldGuide.ember,
    includeFontPadding: false,
  },
  reviewsEmpty: {
    marginTop: 12,
  },

  /* similar */
  similarSection: {
    paddingTop: 24,
  },
  similarHead: {
    paddingHorizontal: 22,
    paddingBottom: 4,
  },
  similarList: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  similarCard: {
    width: 150,
  },
  similarPhoto: {
    width: '100%',
    aspectRatio: 16 / 11,
    borderRadius: fieldGuide.radius.md,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
  },
  similarDist: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: 'rgba(20,22,29,0.72)',
  },
  similarDistText: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 10,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  similarTitle: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 14,
    lineHeight: Math.round(14 * 1.2),
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  similarMeta: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 11,
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  similarRating: {
    color: fieldGuide.emberSoft,
    fontFamily: fieldGuide.fonts.sansSemi,
  },
  similarEmpty: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    color: fieldGuide.creamMute,
    lineHeight: 22,
  },

  /* sticky CTA */
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaRow: {
    paddingHorizontal: 22,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaWalk: {
    flex: 1,
  },
  ctaIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: fieldGuide.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
