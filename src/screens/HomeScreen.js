/**
 * HomeScreen — Field Guide masthead, champion, picks, trending, walking, moods.
 *
 * Source: screens/07-home.html. Treats the Home tab like the cover
 * spread of a printed monthly: a small mono masthead with city, volume,
 * issue, and date; a serif greeting in two voices; a tri-cell stats
 * strip framed by hairlines; the weekly Champion card; horizontal
 * Editor's Picks; a vertical Trending list; a horizontal Within Walking
 * strip (only when location permission is granted); and a By Mood grid
 * built from the CATEGORIES constant.
 *
 * Data flow is preserved verbatim from the pre-Phase-3 implementation:
 *   - useAuth() for the greeting + home city
 *   - useLocation() for nearby + walking
 *   - usePersonalizedSpots(location) — warmed so Explore/SpotDetail
 *     have the cache ready when navigated to
 *   - getAllSpots / searchSpots, getNearbySpots, getEditorsPicks,
 *     getWeeklyChampionSpot, getWeeklySpotRanks
 *   - getSavedSpots / getVisitedSpots for the stats strip numbers
 *   - RefreshControl pull-to-refresh
 *   - logger.error() on every failure path
 *
 * Every visual is built from Field Guide primitives (DisplayTitle,
 * MonoMeta, SectionHead, Rule, SpotCard, ChampionCard, SpotPhoto,
 * DuotoneVibe, IndexStamp). No inline hex colours or fontFamily
 * literals outside the field-guide tokens.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../theme/fieldGuide';
import {
  ChampionCard,
  DisplayTitle,
  DuotoneVibe,
  IndexStamp,
  MonoMeta,
  Rule,
  SectionHead,
  SpotCard,
} from '../components/fieldguide';

import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { usePersonalizedSpots } from '../hooks/usePersonalizedSpots';

import {
  getAllSpots,
  searchSpots,
  getNearbySpots,
  getEditorsPicks,
  getWeeklyChampionSpot,
} from '../services/spots.service';
import { getWeeklySpotRanks } from '../services/weeklyRank.service';
import { getSavedSpots } from '../services/savedSpots.service';
import { getVisitedSpots } from '../services/visitedSpots.service';

import { CATEGORIES } from '../utils/constants';
import { logger } from '../utils/logger';
import {
  formatShortDate,
  formatVolumeIssue,
} from '../utils/issueDate';
import { distanceKmFromUser, formatMiles } from '../utils/geo';

const PAGE_PAD = 22;
const TAB_BAR_SPACE = 96; // FieldGuideTabBar height + safe gap

// Rotating editorial subtitle for the masthead greeting.
// Cycled daily so each visit on the same day shows the same line.
const EDITORIAL_LINES = [
  "The light's good tonight.",
  'Twelve new entries this week.',
  'A quiet hour between the rains.',
];

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

function getTimeGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

function getDailyLine(date = new Date()) {
  const idx = Math.floor(date.getTime() / 86_400_000) % EDITORIAL_LINES.length;
  return EDITORIAL_LINES[idx];
}

function getFirstName(user) {
  if (!user?.name || typeof user.name !== 'string') return 'reader';
  const first = user.name.trim().split(/\s+/)[0];
  return first || 'reader';
}

function prettyCategory(category) {
  if (!category) return '';
  return String(category).replace(/_/g, ' ');
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
/*  STATS STRIP                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function StatsStrip({ nearbyCount, visitedCount, savedCount }) {
  return (
    <View style={styles.statsWrap}>
      <Rule />
      <View style={styles.statsRow}>
        <StatCell
          number={nearbyCount}
          indicator={nearbyCount > 0 ? '↗' : null}
          label={'Nearby\nTonight'}
        />
        <View style={styles.statDivider} />
        <StatCell number={visitedCount} label={'Spots\nVisited'} />
        <View style={styles.statDivider} />
        <StatCell number={savedCount} label={'In Your\nPocket'} />
      </View>
      <Rule />
    </View>
  );
}

function StatCell({ number, indicator, label }) {
  return (
    <View style={styles.statCell}>
      <View style={styles.statNumberRow}>
        <Text style={styles.statNumber}>{String(number ?? 0)}</Text>
        {indicator ? <Text style={styles.statIndicator}>{indicator}</Text> : null}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  TRENDING ROW                                                       */
/* ─────────────────────────────────────────────────────────────────── */

function TrendingRow({ item, position, isLast, onPress }) {
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
  return (
    <View style={styles.ghostCard}>
      <View style={styles.ghostPhoto} />
      <MonoMeta size="spot" style={styles.ghostLabel}>{label}</MonoMeta>
    </View>
  );
}

function ChampionSkeleton() {
  return <View style={styles.championSkeleton} />;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  HOMESCREEN                                                         */
/* ─────────────────────────────────────────────────────────────────── */

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { location } = useLocation();

  // Warm the personalized-spots cache so downstream screens (Explore,
  // SpotDetail's "More like this") read it instantly.
  usePersonalizedSpots(location);

  const [spots, setSpots] = useState([]);
  const [nearbySpots, setNearbySpots] = useState([]);
  const [weeklyRanks, setWeeklyRanks] = useState([]);
  const [editorsPicks, setEditorsPicks] = useState([]);
  const [weeklyChampion, setWeeklyChampion] = useState(null);
  const [stats, setStats] = useState({ nearbyCount: 0, visitedSpots: 0, savedSpots: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

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

  const loadNearby = useCallback(async () => {
    if (!location) return;
    try {
      const result = await getNearbySpots(location.latitude, location.longitude, 5000);
      if (Array.isArray(result)) setNearbySpots(result);
    } catch (error) {
      logger.error({
        service: 'home',
        action: 'load_nearby_error',
        message: 'Error loading nearby spots',
        metadata: { error: error?.message || String(error) },
      });
    }
  }, [location]);

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

  const loadEditorsPicks = useCallback(async () => {
    try {
      const result = await getEditorsPicks();
      if (!result?.error && Array.isArray(result)) {
        setEditorsPicks(result);
      } else {
        setEditorsPicks([]);
      }
    } catch (error) {
      logger.error({
        service: 'home',
        action: 'load_editors_picks_error',
        message: "Error loading editor's picks",
        metadata: { error: error?.message || String(error) },
      });
      setEditorsPicks([]);
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
    loadSpots();
    loadWeeklyRanks();
    loadEditorsPicks();
    loadWeeklyChampion();
    loadStats();
  }, [loadSpots, loadWeeklyRanks, loadEditorsPicks, loadWeeklyChampion, loadStats]);

  useEffect(() => {
    if (location) loadNearby();
  }, [location, loadNearby]);

  useEffect(() => {
    setStats((s) => ({ ...s, nearbyCount: nearbySpots.length }));
  }, [nearbySpots]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadSpots(),
        loadWeeklyRanks(),
        loadEditorsPicks(),
        loadWeeklyChampion(),
        loadStats(),
        location ? loadNearby() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadSpots, loadWeeklyRanks, loadEditorsPicks, loadWeeklyChampion, loadStats, loadNearby, location]);

  /* ── derived ─────────────────────────────────────────────────── */

  const userFirstName = useMemo(() => getFirstName(user), [user]);
  const homeCity = user?.homeCity || 'Lisbon';
  const timeGreeting = useMemo(() => getTimeGreeting(), []);
  const editorialLine = useMemo(() => getDailyLine(), []);
  const issueLine = useMemo(() => formatVolumeIssue(), []);
  const { dayName, dayNum, monShort } = useMemo(() => formatShortDate(), []);

  const greetingText = `${timeGreeting}, ${userFirstName}.\n${editorialLine}`;
  const greetingItalic = `${userFirstName}.`;

  const nearbyCount = stats.nearbyCount;
  const subtitleText = useMemo(() => {
    const headline =
      nearbyCount >= 3
        ? `${nearbyCount} new spots verified this week.`
        : 'A few new spots verified this week.';
    let walking;
    if (nearbyCount <= 0) {
      walking = '';
    } else if (nearbyCount === 1) {
      walking = 'One is within a short walk of you.';
    } else if (nearbyCount < 3) {
      walking = 'A few are within a short walk of you.';
    } else if (nearbyCount >= 12) {
      walking = 'All are within a brief walk of you.';
    } else {
      walking = 'Three are within a six-minute walk of you.';
    }
    return walking ? `${headline} ${walking}` : headline;
  }, [nearbyCount]);

  const championProps = useMemo(() => {
    if (!weeklyChampion) return null;
    const distanceKm = distanceKmFromUser(location, weeklyChampion);
    return {
      id: weeklyChampion.id,
      title: weeklyChampion.title || weeklyChampion.name || 'This week\'s champion',
      blurb:
        weeklyChampion.description ||
        weeklyChampion.blurb ||
        weeklyChampion.summary ||
        undefined,
      vibe: categoryToVibe(weeklyChampion.category),
      rank: weeklyChampion.weeklyRank || 1,
      weekNumber: weeklyChampion.weekNumber,
      category: prettyCategory(weeklyChampion.category),
      district:
        weeklyChampion.district ||
        weeklyChampion.neighbourhood ||
        weeklyChampion.city ||
        undefined,
      distance: distanceKm != null ? formatMiles(distanceKm) : undefined,
    };
  }, [weeklyChampion, location]);

  const moodCategories = useMemo(() => CATEGORIES.slice(0, 6), []);

  /* ── scroll-driven masthead motion ──────────────────────────── */

  const mastOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });
  const mastTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  /* ── renderers ──────────────────────────────────────────────── */

  const goSpotDetail = useCallback(
    (id) => navigation.navigate('SpotDetail', { spotId: id }),
    [navigation],
  );

  const renderPick = useCallback(
    ({ item, index }) => {
      const fieldSpot = toFieldSpot(item, { indexNumber: indexForSpot(item, index) });
      if (!fieldSpot) return null;
      return (
        <SpotCard
          variant="pick"
          spot={fieldSpot}
          onPress={() => goSpotDetail(item.id)}
        />
      );
    },
    [goSpotDetail],
  );

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

  const editorsLabel = useMemo(() => {
    const n = String(editorsPicks.length).padStart(2, '0');
    return `See all ${n}`;
  }, [editorsPicks.length]);

  const showWithinWalking = !!location && nearbySpots.length > 0;

  /* ── render ─────────────────────────────────────────────────── */

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
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
        {/* ─── MASTHEAD ─────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.mast,
            { opacity: mastOpacity, transform: [{ translateY: mastTranslate }] },
          ]}
        >
          <View style={styles.mastRow1}>
            <View style={styles.mastCity}>
              <Ionicons
                name="location-outline"
                size={11}
                color={fieldGuide.cream}
                style={styles.mastCityIcon}
              />
              <Text style={styles.mastCityText}>
                {`${homeCity.toUpperCase()}, PT`}
              </Text>
            </View>
            <View style={styles.mastVolWrap}>
              <Text style={styles.mastVolText}>{issueLine}</Text>
              <Text style={styles.mastVolText}>
                {`${dayName} · ${dayNum} ${monShort}`}
              </Text>
            </View>
          </View>
          <Rule />

          <DisplayTitle
            size="xl"
            weight="400"
            italic={greetingItalic}
            style={styles.greeting}
          >
            {greetingText}
          </DisplayTitle>

          <Text style={styles.subtitle}>{subtitleText}</Text>
        </Animated.View>

        {/* ─── STATS STRIP ──────────────────────────────────── */}
        <StatsStrip
          nearbyCount={stats.nearbyCount}
          visitedCount={stats.visitedSpots}
          savedCount={stats.savedSpots}
        />

        {/* ─── CHAMPION ─────────────────────────────────────── */}
        <View style={styles.championWrap}>
          {championProps ? (
            <ChampionCard
              spot={championProps}
              onPress={() => goSpotDetail(championProps.id)}
            />
          ) : (
            <ChampionSkeleton />
          )}
        </View>

        {/* ─── EDITOR'S PICKS ───────────────────────────────── */}
        <SectionHead
          title="Editor's picks"
          cta={{
            label: editorsLabel,
            onPress: () => navigation.navigate('Explore', { filter: 'editors' }),
          }}
        />
        {editorsPicks.length > 0 ? (
          <FlatList
            data={editorsPicks}
            keyExtractor={(item, idx) => String(item?.id ?? idx)}
            renderItem={renderPick}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScrollPad}
          />
        ) : (
          <View style={styles.hScrollPad}>
            <GhostPickCard />
          </View>
        )}

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
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ─────────────────────────────────────────────────────────────────── */
/*  STYLES                                                             */
/* ─────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },

  /* masthead */
  mast: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 8,
    paddingBottom: 4,
  },
  mastRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
  },
  mastCity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mastCityIcon: {
    marginRight: 6,
  },
  mastCityText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.mono30(9.5),
    color: fieldGuide.cream,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  mastVolWrap: {
    alignItems: 'flex-end',
  },
  mastVolText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.mono30(9.5),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
    lineHeight: 14,
    includeFontPadding: false,
  },
  greeting: {
    marginTop: 18,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: fieldGuide.creamSoft,
    maxWidth: 320,
  },

  /* stats */
  statsWrap: {
    marginTop: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statCell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: fieldGuide.inkLine,
  },
  statNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statNumber: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 26,
    lineHeight: 28,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  statIndicator: {
    marginLeft: 4,
    marginBottom: 4,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wide(10),
    color: fieldGuide.ember,
    includeFontPadding: false,
  },
  statLabel: {
    marginTop: 6,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.widest(9),
    textTransform: 'uppercase',
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },

  /* champion */
  championWrap: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 28,
    paddingBottom: 8,
  },
  championSkeleton: {
    width: '100%',
    aspectRatio: 4 / 5.4,
    borderRadius: fieldGuide.radius.xl,
    backgroundColor: fieldGuide.inkElev,
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
    fontFamily: fieldGuide.fonts.serifLight,
    fontSize: 36,
    lineHeight: 36,
    letterSpacing: -0.03 * 36,
    includeFontPadding: false,
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
    lineHeight: 20,
    letterSpacing: -0.01 * 17,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  moodCount: {
    marginTop: 2,
  },
});
