/**
 * SpotDetailScreen — Phase 4 / design 13 (Field Guide rewrite).
 *
 * The part the app exists for. One full-bleed ScrollView with a sticky
 * "Walk there" / save CTA at the bottom. Layered from top to bottom:
 *
 *   hero        520-pt photo carousel + ink gradient + glass nav-top
 *   title-block kicker / serif title / mono meta with Open/Closed pill
 *   rating-row  big serif rating left, RatingDots + vibe summary right
 *   actions     4-col grid: Save / Review / Directions / Share
 *   story       dropcap paragraph + tag pills
 *   hours       HourBarChart for the week
 *   location    address + MiniMap + contact list
 *   reviews     top 3 inline ReviewRows + "All →"
 *   similar     h-scroll of SpotCard variant="similar"
 *
 * Data:
 *   - useQuery(getSpotById(spotId))            — main payload
 *   - useSpotVibes(spotId)                     — top-3 vibe labels
 *   - useQuery(getSpotComments(id, 1, 3))      — review preview
 *   - useQuery(getNearbySpots(lat, lng, …))    — similar carousel
 *     filtered to shared category, sliced to 10.
 *   - useLocation                              — walk-time
 *   - savedSpots.service                       — pocket toggle
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import {
  CollectionPickerSheet,
  DisplayTitle,
  Dropcap,
  DuotoneVibe,
  EditorialButton,
  EmptyState,
  HourBarChart,
  IconSquare,
  MiniMap,
  MonoMeta,
  Pill,
  RatingDots,
  ReviewRow,
  SaveStamp,
  SpotCard,
} from '../components/fieldguide';
import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import { useLocation } from '../hooks/useLocation';
import { useSpotVibes } from '../hooks/useSpotVibes';
import {
  getNearbySpots,
  getSpotById,
  shareSpot as recordShare,
} from '../services/spots.service';
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
  indexForSpot,
  openStatus,
  prettyCategory,
  vibeForCategory,
  zeroPad,
} from '../utils/spotHelpers';
import { distanceKmFromUser, kmToMiles, walkingMinutes } from '../utils/geo';

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = 520;
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const VISIT_RADIUS_M = 100;

/* ─────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function safeArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  if (Array.isArray(maybe?.items)) return maybe.items;
  if (Array.isArray(maybe?.data)) return maybe.data;
  return [];
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

function splitTitle(title) {
  if (!title || typeof title !== 'string') return [title || '', ''];
  const t = title.trim();
  if (t.length <= 12 || !t.includes(' ')) return [t, ''];
  const last = t.lastIndexOf(' ');
  return [t.slice(0, last), t.slice(last + 1)];
}

function spotImages(spot) {
  const imgs = Array.isArray(spot?.images) ? spot.images.filter(Boolean) : [];
  if (imgs.length) return imgs;
  if (spot?.thumbnail) return [spot.thumbnail];
  if (spot?.coverImage) return [spot.coverImage];
  return [];
}

function topVibesString(vibes) {
  if (!Array.isArray(vibes) || !vibes.length) return '';
  const sorted = [...vibes].sort((a, b) => (b?.count || 0) - (a?.count || 0));
  return sorted
    .slice(0, 3)
    .map((v) => String(v?.name || v?.label || v?.id || '').toUpperCase())
    .filter(Boolean)
    .join(' · ');
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
        <MonoMeta size="spot">{label}</MonoMeta>
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
  const { location: userLocation } = useLocation();

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
  const reviews = useMemo(
    () => safeArray(commentsQuery.data),
    [commentsQuery.data],
  );

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
    }, [refreshVisited]),
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
    } catch (err) {
      logger.error('SpotDetail.toggleSave', err);
      setSaved(!next);
      toast.show('Could not update your pocket.', { variant: 'error' });
    }
  }, [spotId, saved, toast]);

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

  /* ── distance + walking minutes ──────────────────────────────────── */
  const distanceKm = useMemo(() => {
    if (!coords || !userLocation) return null;
    return distanceKmFromUser(userLocation, {
      latitude: coords.lat,
      longitude: coords.lng,
    });
  }, [coords, userLocation]);
  const walkMin = useMemo(() => walkingMinutes(distanceKm), [distanceKm]);
  const canStamp = useMemo(() => {
    if (distanceKm == null) return false;
    return distanceKm * 1000 <= VISIT_RADIUS_M;
  }, [distanceKm]);
  const distanceMiles = useMemo(() => {
    if (distanceKm == null) return null;
    return kmToMiles(distanceKm);
  }, [distanceKm]);
  const distanceLabel = useMemo(() => {
    if (distanceMiles == null) return null;
    if (distanceMiles < 0.1) return '< 0.1 MILES';
    return `${distanceMiles.toFixed(1)} MILES`;
  }, [distanceMiles]);

  /* ── action handlers ─────────────────────────────────────────────── */
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleShare = useCallback(async () => {
    if (!spot) return;
    try {
      await Share.share({
        title: spot.title,
        message: `${spot.title} on VibeSpot — ${spot?.address || ''}`.trim(),
        url: spot?.shareUrl || undefined,
      });
      if (spotId) {
        // Best-effort: count the share. Ignore errors silently.
        recordShare(spotId).catch(() => {});
      }
    } catch (err) {
      logger.error('SpotDetail.share', err);
    }
  }, [spot, spotId]);

  const openDirections = useCallback(async () => {
    if (!coords) {
      toast.show('No location for this spot yet.', { variant: 'info' });
      return;
    }
    const url = `https://maps.google.com/?daddr=${coords.lat},${coords.lng}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      logger.error('SpotDetail.directions', err);
      toast.show('Could not open maps.', { variant: 'error' });
    }
  }, [coords, toast]);

  const handleStampVisit = useCallback(async () => {
    if (!spotId || visited || visitBusy) return;
    if (!canStamp) {
      toast.show("You're not close enough yet — within 100 m to stamp.", {
        variant: 'info',
      });
      return;
    }
    setVisitBusy(true);
    setVisited(true);
    try {
      const result = await markSpotAsVisited(spotId);
      if (result?.error) throw new Error(result.error);
      toast.show("Stamped · you've been here.", { variant: 'success' });
    } catch (err) {
      logger.error('SpotDetail.stampVisit', err);
      setVisited(false);
      toast.show('Could not stamp this visit.', { variant: 'error' });
    } finally {
      setVisitBusy(false);
    }
  }, [spotId, visited, visitBusy, canStamp, toast]);

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
  const idxLabel = `NO. ${zeroPad(indexForSpot(spot, 0), 3)}`;
  const status = openStatus(spot);
  const price = priceSymbol(spot);
  const [titleLead, titleTail] = splitTitle(spot.title);
  const vibe = vibeForCategory(spot.category);
  const todayKey = DAY_KEYS[new Date().getDay()];
  const vibeSummary = topVibesString(spotVibes);
  const avgRating = Number(spot.averageRating ?? spot.rating ?? 0);
  const reviewCount = Number(
    spot.reviewCount ?? spot.commentCount ?? reviews.length ?? 0,
  );

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
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

          {/* hero-meta */}
          <View
            style={[
              styles.heroMeta,
              { top: insets.top + 16 },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.heroMetaText}>
              {[idxLabel, spot.championWeek != null ? `CHAMPION WEEK ${spot.championWeek}` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>

          {/* nav-top */}
          <View
            style={[
              styles.navTop,
              { top: insets.top + 6 },
            ]}
            pointerEvents="box-none"
          >
            <IconSquare
              onPress={() => navigation.goBack()}
              accessibilityLabel="Back"
              size={38}
            >
              <Ionicons name="chevron-back" size={18} color={fieldGuide.cream} />
            </IconSquare>
            <View style={styles.navTopRight}>
              <Pressable
                onLongPress={() => setPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Long-press to add to pocket"
                style={styles.navSavePressable}
              >
                <SaveStamp
                  saved={saved}
                  onToggle={toggleSave}
                  size={38}
                  style={styles.navSaveStamp}
                />
              </Pressable>
              <View style={{ width: 8 }} />
              <IconSquare onPress={handleShare} accessibilityLabel="Share" size={38}>
                <Ionicons name="share-outline" size={16} color={fieldGuide.cream} />
              </IconSquare>
              <View style={{ width: 8 }} />
              <IconSquare
                onPress={() =>
                  toast.show('More options coming soon.', { variant: 'info' })
                }
                accessibilityLabel="More"
                size={38}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color={fieldGuide.cream}
                />
              </IconSquare>
            </View>
          </View>

          {/* hero count pill */}
          {images.length > 1 ? (
            <View style={styles.heroCount}>
              <Ionicons name="images-outline" size={11} color={fieldGuide.cream} />
              <Text style={styles.heroCountText}>
                {`${heroIndex + 1} / ${images.length}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* TITLE BLOCK */}
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>
            <Text style={styles.kickerNo}>{idxLabel}</Text>
            {spot.championWeek != null
              ? ` · CHAMPION WEEK ${spot.championWeek}`
              : ''}
          </Text>
          <DisplayTitle
            size="xl"
            weight="400"
            style={{ marginTop: 8 }}
          >
            {titleTail ? `${titleLead}\n${titleTail}` : titleLead}
          </DisplayTitle>
          <View style={styles.titleMeta}>
            <Text style={styles.titleMetaStrong}>
              {prettyCategory(spot.category).toUpperCase() || 'SPOT'}
            </Text>
            {spot.district || spot.city ? (
              <>
                <Text style={styles.titleMetaDot}>·</Text>
                <Text style={styles.titleMetaStrong}>
                  {(spot.district || spot.city).toUpperCase()}
                </Text>
              </>
            ) : null}
            {price ? (
              <>
                <Text style={styles.titleMetaDot}>·</Text>
                <Text style={styles.titleMetaStrong}>{price}</Text>
              </>
            ) : null}
            {status.isOpen === true ? (
              <>
                <Text style={styles.titleMetaDot}>·</Text>
                <View style={styles.openWrap}>
                  <View style={styles.openDot} />
                  <Text style={styles.openText}>{status.label}</Text>
                </View>
              </>
            ) : status.isOpen === false ? (
              <>
                <Text style={styles.titleMetaDot}>·</Text>
                <Text style={styles.closedText}>{status.label}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* RATING ROW */}
        <View style={styles.ratingRow}>
          <View>
            <Text style={styles.ratingBig}>
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              <Text style={styles.ratingSmall}>/5</Text>
            </Text>
            <MonoMeta size="spot" style={{ marginTop: 4 }}>
              {`FROM ${reviewCount} REVIEW${reviewCount === 1 ? '' : 'S'}`}
            </MonoMeta>
          </View>
          <View style={styles.ratingRight}>
            <RatingDots value={avgRating || 0} showNumber={false} size="md" />
            {vibeSummary ? (
              <MonoMeta size="spot" style={styles.vibeLine}>
                {vibeSummary}
              </MonoMeta>
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
            icon="create-outline"
            label="Review"
            onPress={() => navigation.navigate('WriteReview', { spotId })}
          />
          <ActionCell
            icon="navigate-outline"
            label="Directions"
            onPress={openDirections}
          />
          <ActionCell
            icon="share-outline"
            label="Share"
            onPress={handleShare}
          />
        </View>

        {/* STORY */}
        {spot.description ? (
          <View style={styles.section}>
            <StoryBlock description={spot.description} />
            {Array.isArray(spot.tags) && spot.tags.length > 0 ? (
              <View style={styles.tagRow}>
                {spot.tags.slice(0, 8).map((t, i) => (
                  <Pill key={`${t}-${i}`} variant="default">
                    {String(t).toUpperCase()}
                  </Pill>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* HOURS */}
        <View style={styles.section}>
          <MonoMeta size="eyebrow">Hours · This week</MonoMeta>
          <Text style={styles.sectionTitle}>When to come</Text>
          {spot.hours ? (
            <View style={{ marginTop: 14 }}>
              <HourBarChart hours={spot.hours} today={todayKey} />
            </View>
          ) : (
            <Text style={styles.hoursMissing}>
              Hours not listed yet — we’re checking with the editors.
            </Text>
          )}
        </View>

        {/* LOCATION */}
        <View style={styles.section}>
          <MonoMeta size="eyebrow">
            {`Location${distanceLabel ? ` · ${distanceLabel}` : ''}`}
          </MonoMeta>
          <Text style={styles.sectionTitle}>
            {spot.address || 'Address coming soon'}
          </Text>
          <View style={styles.miniMapWrap}>
            <MiniMap
              location={
                coords ? { lat: coords.lat, lng: coords.lng } : undefined
              }
              drawn
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
              <MonoMeta size="eyebrow">
                {`Reviews${reviewCount ? ` · ${reviewCount} TOTAL` : ''}`}
              </MonoMeta>
              <Text style={styles.sectionTitle}>What people noticed</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Reviews', { spotId })}
              hitSlop={8}
            >
              <Text style={styles.allLink}>All →</Text>
            </Pressable>
          </View>

          {commentsQuery.isLoading ? (
            <View style={{ paddingVertical: 24 }}>
              <ActivityIndicator color={fieldGuide.ember} />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.reviewsEmpty}>
              <EmptyState
                title="Be the first to leave a stamp."
                italic="first"
                body="A short, honest note helps the next reader figure out if this is their kind of place."
                cta={{
                  label: 'Write a review',
                  onPress: () => navigation.navigate('WriteReview', { spotId }),
                }}
              />
            </View>
          ) : (
            <View style={{ marginTop: 4 }}>
              {reviews.slice(0, 3).map((r, i) => (
                <ReviewRow key={String(r?.id || i)} review={r} />
              ))}
            </View>
          )}
        </View>

        {/* SIMILAR */}
        <View style={styles.similarSection}>
          <View style={styles.similarHead}>
            <MonoMeta size="eyebrow">Similar vibes</MonoMeta>
            <Text style={styles.sectionTitle}>If you liked this</Text>
          </View>
          {similarQuery.isLoading ? (
            <View style={{ paddingVertical: 24, paddingHorizontal: 22 }}>
              <ActivityIndicator color={fieldGuide.ember} />
            </View>
          ) : similar.length === 0 ? (
            <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
              <Text style={styles.similarEmpty}>
                Nothing nearby with the same vibe yet — pull up the map to
                wander.
              </Text>
            </View>
          ) : (
            <FlatList
              data={similar}
              keyExtractor={(item, i) => String(item?.id || i)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarList}
              renderItem={({ item, index }) => (
                <SpotCard
                  spot={{
                    ...item,
                    vibe: vibeForCategory(item?.category),
                    indexNumber: indexForSpot(item, index),
                    category: prettyCategory(item?.category).toUpperCase(),
                    district: (item?.district || item?.city || '').toUpperCase(),
                    image: item?.thumbnail ? { uri: item.thumbnail } : undefined,
                  }}
                  variant="similar"
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
          style={[
            styles.ctaRow,
            { paddingBottom: insets.bottom + 4 },
          ]}
        >
          <View style={styles.ctaCol}>
            <View style={styles.ctaActions}>
              <EditorialButton
                variant="primary"
                size="md"
                leading={
                  <Ionicons name="walk-outline" size={16} color="#FFF8F1" />
                }
                onPress={openDirections}
                style={styles.ctaWalk}
              >
                {walkMin != null
                  ? `Walk there · ${walkMin} min`
                  : 'Open directions'}
              </EditorialButton>
              <EditorialButton
                variant="ghost"
                size="md"
                onPress={handleStampVisit}
                disabled={visited || !canStamp || visitBusy || !userLocation}
                loading={visitBusy}
                style={styles.ctaStamp}
              >
                {visited ? 'Visited' : 'Stamp visit'}
              </EditorialButton>
            </View>
            {!visited && !canStamp ? (
              <MonoMeta size="tab" style={styles.ctaHint}>
                WITHIN 100 M TO STAMP
              </MonoMeta>
            ) : null}
          </View>
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Save into a pocket"
            style={({ pressed }) => [
              styles.ctaIconBtn,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={fieldGuide.ink}
            />
          </Pressable>
        </View>
      </View>

      <CollectionPickerSheet
        visible={pickerOpen}
        spotId={spotId}
        onClose={() => setPickerOpen(false)}
        onCreateNew={() => navigation.navigate('CreateCollection')}
      />
    </View>
  );
};

export default SpotDetailScreen;

/* ─────────────────────────────────────────────────────────────────── */
/*  STORY BLOCK                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function StoryBlock({ description }) {
  const paragraphs = description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paragraphs.length) return null;
  const [first, ...rest] = paragraphs;
  const firstChar = first.charAt(0);
  const firstBody = first.slice(1);
  return (
    <View>
      <Dropcap letter={firstChar}>
        <Text style={styles.storyBody}>
          {firstBody}
        </Text>
      </Dropcap>
      {rest.map((p, i) => (
        <Text key={i} style={[styles.storyBody, styles.storyParagraph]}>
          {p}
        </Text>
      ))}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  CONTACT LIST                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function ContactList({ spot, onOpen, onMaps }) {
  const rows = [
    spot.address && {
      icon: 'location-outline',
      label: 'Address',
      value: spot.address,
      onPress: onMaps,
    },
    spot.website && {
      icon: 'globe-outline',
      label: 'Website',
      value: String(spot.website).replace(/^https?:\/\//, ''),
      onPress: () =>
        onOpen(
          spot.website.startsWith('http')
            ? spot.website
            : `https://${spot.website}`,
        ),
    },
    spot.instagram && {
      icon: 'logo-instagram',
      label: 'Instagram',
      value: spot.instagram.startsWith('@')
        ? spot.instagram
        : `@${spot.instagram}`,
      onPress: () =>
        onOpen(
          `https://instagram.com/${String(spot.instagram).replace('@', '')}`,
        ),
    },
    spot.facebook && {
      icon: 'logo-facebook',
      label: 'Facebook',
      value: spot.facebook,
      onPress: () =>
        onOpen(`https://facebook.com/${String(spot.facebook).replace('@', '')}`),
    },
    spot.twitter && {
      icon: 'logo-twitter',
      label: 'Twitter',
      value: spot.twitter.startsWith('@')
        ? spot.twitter
        : `@${spot.twitter}`,
      onPress: () =>
        onOpen(`https://twitter.com/${String(spot.twitter).replace('@', '')}`),
    },
    spot.phone && {
      icon: 'call-outline',
      label: 'Phone',
      value: spot.phone,
      onPress: () => onOpen(`tel:${String(spot.phone).replace(/\s+/g, '')}`),
    },
    spot.email && {
      icon: 'mail-outline',
      label: 'Email',
      value: spot.email,
      onPress: () => onOpen(`mailto:${spot.email}`),
    },
  ].filter(Boolean);

  if (rows.length === 0) {
    return (
      <Text style={styles.contactFallback}>
        No contact details yet — ask the editors at readers@vibespot.co.
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
  heroMeta: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9,
  },
  heroMetaText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.widest(9.5),
    color: 'rgba(244,239,230,0.7)',
    textTransform: 'uppercase',
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
  },
  navSavePressable: {
    width: 38,
    height: 38,
  },
  navSaveStamp: {
    top: 0,
    right: 0,
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
    marginTop: -80,
    paddingHorizontal: 22,
    zIndex: 2,
    position: 'relative',
  },
  kicker: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.ember,
    textTransform: 'uppercase',
  },
  kickerNo: {
    color: fieldGuide.creamMute,
  },
  titleMeta: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  titleMetaStrong: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.cream,
    textTransform: 'uppercase',
    marginRight: 10,
  },
  titleMetaDot: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    color: fieldGuide.creamMute,
    marginRight: 10,
  },
  openWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: fieldGuide.moss,
    marginRight: 6,
  },
  openText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.moss,
    textTransform: 'uppercase',
  },
  closedText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
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
  ratingBig: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 36,
    lineHeight: 36,
    color: fieldGuide.cream,
    letterSpacing: -0.02 * 36,
    includeFontPadding: false,
  },
  ratingSmall: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 14,
    color: fieldGuide.creamMute,
  },
  ratingRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  vibeLine: {
    marginTop: 2,
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
  sectionTitle: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
    letterSpacing: -0.005 * 18,
    includeFontPadding: false,
  },
  storyBody: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14.5,
    lineHeight: 24,
    color: fieldGuide.creamSoft,
  },
  storyParagraph: {
    marginTop: 12,
  },
  tagRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  /* hours fallback */
  hoursMissing: {
    marginTop: 12,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    color: fieldGuide.creamMute,
    lineHeight: 22,
  },

  /* location */
  miniMapWrap: {
    marginTop: 14,
    marginBottom: 18,
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
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.ember,
    textTransform: 'uppercase',
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
    alignItems: 'flex-end',
    gap: 8,
  },
  ctaCol: {
    flex: 1,
    minWidth: 0,
  },
  ctaActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  ctaWalk: {
    flex: 1,
  },
  ctaStamp: {
    flex: 0.45,
    minWidth: 108,
  },
  ctaHint: {
    marginTop: 6,
    color: fieldGuide.creamMute,
    textAlign: 'center',
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
