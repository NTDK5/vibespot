/**
 * ExploreScreen — Field Guide search + filter + grid/list.
 *
 * Source: screens/08-explore.html. Top to bottom:
 *
 *   1. X-HEAD ........... eyebrow + serif "What are you in the mood for?"
 *   2. SEARCH ........... FG SearchBar with a filter icon trailing
 *   3. FILTER PILL ROW .. horizontal scroller — ember "ALL · count"
 *                          first, then one Pill per CATEGORIES entry
 *   4. RESULT HEAD ...... mono count line + Grid/List Segmented
 *   5. RESULTS .......... FlatList in numColumns=2 grid or numColumns=1
 *                          horizontal-row list mode
 *   6. FAB .............. cream circle bottom-right, opens FilterSheet
 *
 * Preserves the original debounced search (400 ms), the
 * `selectedCategory` state, and the getAllSpots / searchSpots call
 * shape. Adds:
 *   - route param awareness on mount: `category`, `sort`, `filter`
 *   - client-side post-fetch filtering for `openNow`, distance, price,
 *     and rating (so Filter Sheet edits update the list live without
 *     the backend needing new query params)
 *   - sort modes: mood (default) | trending | closest | rating | new
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../theme/fieldGuide';
import { BRAND } from '../brand/fena';
import {
  DisplayTitle,
  DuotoneVibe,
  FilterSheet,
  DEFAULT_FILTERS,
  IndexStamp,
  MonoMeta,
  Pill,
  SearchBar,
  Segmented,
  SpotPhoto,
} from '../components/fieldguide';

import EmptyState from '../components/fieldguide/state/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';

import { searchSpots } from '../services/spots.service';
import {
  saveSpot,
  unsaveSpot,
} from '../services/savedSpots.service';

import { CATEGORIES } from '../utils/constants';
import { logger } from '../utils/logger';
import { distanceKmFromUser, formatMiles, kmToMiles } from '../utils/geo';
import { openStatus } from '../utils/spotHelpers';

/* ─────────────────────────────────────────────────────────────────── */
/*  CONSTANTS / HELPERS                                                */
/* ─────────────────────────────────────────────────────────────────── */

const PAGE_PAD = 22;
const TAB_BAR_SPACE = 96;
const FAB_BOTTOM_OFFSET = 70 + 16; // brief: safeBottom + 70 + 16
const PAGE_LIMIT = 24;

const PRICE_TIER_TO_API = ['free', 'low', 'medium', 'high', 'premium'];

const SORT_LABEL = {
  mood:     'MOOD',
  trending: 'TRENDING',
  closest:  'CLOSEST',
  rating:   'RATING',
  new:      'NEW THIS WEEK',
};

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

function categoryToVibe(category) {
  if (!category) return 'cafe';
  return CATEGORY_VIBE[String(category).toLowerCase()] || 'cafe';
}

function prettyCategory(category) {
  if (!category) return '';
  return String(category).replace(/_/g, ' ');
}

function indexForSpot(spot, fallbackIndex) {
  const raw = String(spot?.id || '');
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 2) return digits.slice(-3).padStart(3, '0');
  return String(fallbackIndex + 1).padStart(3, '0');
}

function getCount(arr) {
  return Array.isArray(arr) ? arr.length : 0;
}

function applyClientFilters(spots, filters, location, filterMode) {
  if (!Array.isArray(spots)) return [];
  let list = spots.slice();

  if (filterMode === 'editors') {
    list = list.filter((s) => s?.isEditorsPick === true);
  }

  if (filters.openNow) {
    list = list.filter((s) => openStatus(s).isOpen === true);
  }

  if (typeof filters.priceTier === 'number' && filters.priceTier >= 0) {
    const apiVal = PRICE_TIER_TO_API[filters.priceTier];
    if (apiVal) {
      list = list.filter(
        (s) =>
          String(s?.priceRange || '').toLowerCase() === apiVal ||
          (apiVal === 'premium' && Number(s?.priceRange) === 4),
      );
    }
  }

  if (filters.minRating > 0) {
    list = list.filter((s) => Number(s?.ratingAvg || 0) >= filters.minRating);
  }

  if (filters.maxDistanceMi < 5 && location) {
    list = list.filter((s) => {
      const km = distanceKmFromUser(location, s);
      if (km == null) return true;
      const mi = kmToMiles(km);
      return mi == null ? true : mi <= filters.maxDistanceMi;
    });
  }

  return list;
}

function applySort(spots, mode, location) {
  if (!Array.isArray(spots) || spots.length === 0) return spots;
  const arr = spots.slice();
  switch (mode) {
    case 'trending':
      return arr.sort(
        (a, b) =>
          (Number(a?.weeklyRank) || 999) - (Number(b?.weeklyRank) || 999),
      );
    case 'closest':
      if (!location) return arr;
      return arr.sort((a, b) => {
        const ka = distanceKmFromUser(location, a) ?? Number.POSITIVE_INFINITY;
        const kb = distanceKmFromUser(location, b) ?? Number.POSITIVE_INFINITY;
        return ka - kb;
      });
    case 'rating':
      return arr.sort(
        (a, b) => Number(b?.ratingAvg || 0) - Number(a?.ratingAvg || 0),
      );
    case 'new':
      return arr.sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      });
    case 'mood':
    default:
      return arr;
  }
}

/* ─────────────────────────────────────────────────────────────────── */
/*  GRID + LIST CARDS                                                  */
/* ─────────────────────────────────────────────────────────────────── */

function GridSpotCard({ spot, indexNumber, distanceLabel, savedByMe, onPress, onToggleSave }) {
  const status = openStatus(spot);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spot?.title || 'Spot'}
      style={({ pressed }) => [
        styles.gridCard,
        { opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <SpotPhoto
        vibe={categoryToVibe(spot?.category)}
        image={spot?.thumbnail ? { uri: spot.thumbnail } : undefined}
        aspect="3/4"
        index={`NO. ${indexNumber}`}
        saved={savedByMe}
        onToggleSave={onToggleSave}
      />

      <Text style={styles.gridTitle} numberOfLines={2}>
        {spot?.title || 'Untitled'}
      </Text>

      <MonoMeta size="spot" style={styles.gridMeta}>
        {[prettyCategory(spot?.category), spot?.district]
          .filter(Boolean)
          .join('  ·  ')}
      </MonoMeta>

      <View style={styles.stampRow}>
        {status.isOpen === true ? (
          <View style={styles.openWrap}>
            <View style={styles.mossDot} />
            <Text style={styles.openText}>{status.label}</Text>
          </View>
        ) : status.isOpen === false ? (
          <Text style={styles.closedText} numberOfLines={1}>{status.label}</Text>
        ) : (
          <Text style={styles.dashText}>—</Text>
        )}
        {distanceLabel ? (
          <Text style={styles.distText}>{distanceLabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ListSpotRow({ spot, indexNumber, distanceLabel, onPress }) {
  const status = openStatus(spot);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spot?.title || 'Spot'}
      style={({ pressed }) => [
        styles.listRow,
        { opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={styles.listThumb}>
        <DuotoneVibe
          vibe={categoryToVibe(spot?.category)}
          image={spot?.thumbnail ? { uri: spot.thumbnail } : undefined}
        />
        <IndexStamp position="tl">NO. {indexNumber}</IndexStamp>
      </View>

      <View style={styles.listBody}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {spot?.title || 'Untitled'}
        </Text>
        <MonoMeta size="spot" style={styles.listMeta}>
          {[prettyCategory(spot?.category), spot?.district]
            .filter(Boolean)
            .join('  ·  ')}
        </MonoMeta>
        <View style={styles.listStatusRow}>
          {status.isOpen === true ? (
            <View style={styles.openWrap}>
              <View style={styles.mossDot} />
              <Text style={styles.openText}>{status.label}</Text>
            </View>
          ) : status.isOpen === false ? (
            <Text style={styles.closedText}>{status.label}</Text>
          ) : null}
        </View>
      </View>

      {distanceLabel ? (
        <Pill variant="default">{distanceLabel}</Pill>
      ) : null}
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  EXPLORESCREEN                                                      */
/* ─────────────────────────────────────────────────────────────────── */

export const ExploreScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { location } = useLocation();

  // Pull initial params off the route — Home links here with
  // { category }, { sort: 'trending' }, or { filter: 'editors' }.
  const initialCategory = route?.params?.category ?? null;
  const initialSort = route?.params?.sort ?? 'mood';
  const initialFilter = route?.params?.filter ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [filterMode, setFilterMode] = useState(initialFilter);
  const [sortMode, setSortMode] = useState(initialSort);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState(0); // 0=grid, 1=list

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    sort: ['closest', 'rating', 'new'].includes(initialSort)
      ? initialSort
      : DEFAULT_FILTERS.sort,
  });

  // Track in-flight saved-spot toggles so the optimistic UI stays
  // honest when the user taps the SaveStamp twice quickly.
  const savedOptimistic = useRef(new Map());
  const initialFetchDone = useRef(false);

  /* ── re-sync from route params when re-entered with new args ── */
  useEffect(() => {
    setSelectedCategory(route?.params?.category ?? null);
    setFilterMode(route?.params?.filter ?? null);
    if (route?.params?.sort) setSortMode(route.params.sort);
  }, [route?.params?.category, route?.params?.sort, route?.params?.filter]);

  /* ── fetch (debounced on search) ────────────────────────────── */

  const fetchSpots = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const apiPrice =
        typeof filters.priceTier === 'number'
          ? PRICE_TIER_TO_API[filters.priceTier]
          : undefined;

      const result = await searchSpots({
        q: searchQuery.trim() || undefined,
        category: selectedCategory || undefined,
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
        priceRange: apiPrice,
        page: pageNum,
        limit: PAGE_LIMIT,
      });
      const list = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.spots)
          ? result.spots
          : Array.isArray(result)
            ? result
            : [];
      setHasMore(list.length >= PAGE_LIMIT);
      setPage(pageNum);
      if (append) {
        setSpots((prev) => {
          const seen = new Set(prev.map((s) => String(s?.id)));
          const next = list.filter((s) => s?.id != null && !seen.has(String(s.id)));
          return [...prev, ...next];
        });
      } else {
        setSpots(list);
      }
    } catch (error) {
      logger.error({
        service: 'explore',
        action: 'fetch_spots_error',
        message: 'Error fetching spots',
        metadata: { error: error?.message || String(error) },
      });
      if (!append) setSpots([]);
    } finally {
      if (pageNum === 1) {
        initialFetchDone.current = true;
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [searchQuery, selectedCategory, filters.minRating, filters.priceTier]);

  useFocusEffect(
    useCallback(() => {
      if (!initialFetchDone.current || loading || spots.length > 0) return;
      fetchSpots();
    }, [loading, spots.length, fetchSpots]),
  );

  const loadMoreSpots = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchSpots(page + 1, true);
  }, [loading, loadingMore, hasMore, page, fetchSpots]);

  // Debounced re-fetch on text-search change. Intentionally scoped
  // to searchQuery so typing doesn't double-fire alongside the
  // category/filter effect below.
  useEffect(() => {
    const t = setTimeout(() => {
      fetchSpots();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Immediate re-fetch when category or server-side filters change.
  useEffect(() => {
    fetchSpots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, filters.minRating, filters.priceTier]);

  /* ── derived list ───────────────────────────────────────────── */

  const filteredSpots = useMemo(
    () => applyClientFilters(spots, filters, location, filterMode),
    [spots, filters, location, filterMode],
  );

  const sortedSpots = useMemo(
    () => applySort(filteredSpots, sortMode, location),
    [filteredSpots, sortMode, location],
  );

  const totalCount = sortedSpots.length;

  /* ── interactions ───────────────────────────────────────────── */

  const goSpotDetail = useCallback(
    (id) => navigation.navigate('SpotDetail', { spotId: id }),
    [navigation],
  );

  const handlePillPress = useCallback((catId) => {
    setSelectedCategory((curr) => (curr === catId ? null : catId));
  }, []);

  const handleFiltersChange = useCallback((next) => {
    setFilters(next);
    // Filter sheet's sort enum drives the screen's sortMode too —
    // unless we're on 'mood' or 'trending' set by a route param and
    // the user hasn't touched the sheet sort.
    if (next.sort !== filters.sort) {
      setSortMode(next.sort);
    }
  }, [filters.sort]);

  const handleFiltersReset = useCallback(() => {
    setSortMode('mood');
  }, []);

  const toggleSave = useCallback(async (spotId, currentlySaved) => {
    if (!user) {
      navigation.navigate('SignIn');
      return;
    }
    if (!spotId) return;
    if (savedOptimistic.current.get(spotId)) return;

    savedOptimistic.current.set(spotId, true);
    setSpots((curr) =>
      curr.map((s) =>
        s?.id === spotId ? { ...s, savedByMe: !currentlySaved } : s,
      ),
    );

    try {
      const action = currentlySaved ? unsaveSpot : saveSpot;
      const result = await action(spotId);
      if (result?.error) throw new Error(result.error);
    } catch (error) {
      // revert on failure
      setSpots((curr) =>
        curr.map((s) =>
          s?.id === spotId ? { ...s, savedByMe: currentlySaved } : s,
        ),
      );
      logger.error({
        service: 'explore',
        action: 'toggle_save_error',
        message: 'Error toggling save state',
        metadata: { spotId, currentlySaved, error: error?.message || String(error) },
      });
    } finally {
      savedOptimistic.current.delete(spotId);
    }
  }, [user, navigation]);

  /* ── renderers ──────────────────────────────────────────────── */

  const renderGrid = useCallback(({ item, index }) => {
    const km = distanceKmFromUser(location, item);
    const dist = km != null ? formatMiles(km) : undefined;
    return (
      <View style={{ flex: 1 }}>
        <GridSpotCard
          spot={item}
          indexNumber={indexForSpot(item, index)}
          distanceLabel={dist}
          savedByMe={!!item?.savedByMe}
          onPress={() => goSpotDetail(item.id)}
          onToggleSave={() => toggleSave(item.id, !!item?.savedByMe)}
        />
      </View>
    );
  }, [goSpotDetail, toggleSave, location]);

  const renderList = useCallback(({ item, index }) => {
    const km = distanceKmFromUser(location, item);
    const dist = km != null ? formatMiles(km) : undefined;
    return (
      <ListSpotRow
        spot={item}
        indexNumber={indexForSpot(item, index)}
        distanceLabel={dist}
        onPress={() => goSpotDetail(item.id)}
      />
    );
  }, [goSpotDetail, location]);

  /* ── render ─────────────────────────────────────────────────── */

  const sortLabel = SORT_LABEL[sortMode] || SORT_LABEL.mood;
  const cityLabel = BRAND.serviceCityName;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── X-HEAD ───────────────────────────────────────────── */}
      <View style={styles.xHead}>
        <MonoMeta size="eyebrow" style={styles.xHeadEyebrow}>
          Section · Explore
        </MonoMeta>
        <DisplayTitle size="md" weight="500" style={styles.xHeadTitle}>
          What are you in the mood for?
        </DisplayTitle>
        <MonoMeta size="eyebrow" style={styles.xHeadSubtitle}>
          {`Showing spots in ${cityLabel}`}
        </MonoMeta>
      </View>

      {/* ─── SEARCH ───────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search a name, a vibe, a street…"
          trailing={
            <Pressable
              onPress={() => setFiltersOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open filters"
              hitSlop={6}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={fieldGuide.creamMute}
              />
            </Pressable>
          }
        />
      </View>

      {/* ─── FILTER PILL ROW ──────────────────────────────────── */}
      <View style={styles.pillRowWrap}>
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRowContent}
        >
          <Pill
            variant={selectedCategory == null ? 'ember' : 'default'}
            dot={selectedCategory == null}
            onPress={() => setSelectedCategory(null)}
          >
            {`ALL · ${totalCount}`}
          </Pill>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Pill
                key={cat.id}
                variant={active ? 'ember' : 'default'}
                dot={active}
                onPress={() => handlePillPress(cat.id)}
              >
                {cat.label}
              </Pill>
            );
          })}
        </Animated.ScrollView>
      </View>

      {/* ─── RESULT HEAD ──────────────────────────────────────── */}
      <View style={styles.resultHead}>
        <Text style={styles.resultCount} numberOfLines={1}>
          <Text style={styles.resultCountBold}>{totalCount}</Text>
          {` SPOTS · ${cityLabel.toUpperCase()} · SORTED BY ${sortLabel}`}
        </Text>
        <Segmented
          compact
          value={viewMode}
          onChange={setViewMode}
          items={[
            { icon: 'grid-outline', ariaLabel: 'Grid view' },
            { icon: 'list', ariaLabel: 'List view' },
          ]}
        />
      </View>

      {/* ─── RESULTS ──────────────────────────────────────────── */}
      <FlatList
        key={viewMode === 0 ? 'grid' : 'list'}
        data={sortedSpots}
        keyExtractor={(item, idx) => String(item?.id ?? idx)}
        numColumns={viewMode === 0 ? 2 : 1}
        columnWrapperStyle={viewMode === 0 ? styles.gridRow : undefined}
        renderItem={viewMode === 0 ? renderGrid : renderList}
        removeClippedSubviews={Platform.OS !== 'android'}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        onEndReached={loadMoreSpots}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerSpinner}>
              <ActivityIndicator color={fieldGuide.ember} />
            </View>
          ) : null
        }
        contentContainerStyle={[
          viewMode === 0 ? styles.gridContent : styles.listContent,
          {
            paddingBottom:
              TAB_BAR_SPACE + Math.max(insets.bottom, 12) + FAB_BOTTOM_OFFSET,
          },
        ]}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Reading the room…</Text>
            </View>
          ) : (
            <EmptyState
              pageName="EXPLORE"
              title="No matches in the index"
              italic="index"
              body="Try a different mood, or clear your search."
            />
          )
        }
      />

      {/* ─── FAB ──────────────────────────────────────────────── */}
      <Pressable
        onPress={() => setFiltersOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open filters"
        hitSlop={8}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: TAB_BAR_SPACE + insets.bottom + 16,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <Ionicons name="options-outline" size={20} color={fieldGuide.inkText} />
      </Pressable>

      {/* ─── FILTER SHEET ─────────────────────────────────────── */}
      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onChange={handleFiltersChange}
        onReset={handleFiltersReset}
        resultCount={totalCount}
      />
    </SafeAreaView>
  );
};

export default ExploreScreen;

/* ─────────────────────────────────────────────────────────────────── */
/*  STYLES                                                             */
/* ─────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },

  /* x-head */
  xHead: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: fieldGuide.inkLine,
  },
  xHeadEyebrow: {
    marginBottom: 4,
  },
  xHeadTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.01 * 26,
    color: fieldGuide.cream,
  },
  xHeadSubtitle: {
    marginTop: 6,
    color: fieldGuide.creamMute,
  },

  /* search */
  searchWrap: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 14,
  },

  /* pill row */
  pillRowWrap: {
    paddingVertical: 14,
  },
  pillRowContent: {
    paddingHorizontal: PAGE_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  /* result head */
  resultHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: fieldGuide.inkLine,
  },
  resultCount: {
    flex: 1,
    marginRight: 12,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  resultCountBold: {
    color: fieldGuide.cream,
    fontFamily: fieldGuide.fonts.monoMed,
  },

  /* grid */
  footerSpinner: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  gridContent: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 4,
    gap: 18,
  },
  gridRow: {
    gap: 12,
  },
  gridCard: {
    flexDirection: 'column',
  },
  gridTitle: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 15.5,
    lineHeight: Math.round(15.5 * 1.18),
    letterSpacing: -0.005 * 15.5,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  gridMeta: {
    marginTop: 4,
  },
  stampRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mossDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: fieldGuide.moss,
    marginRight: 5,
  },
  openText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wide(10),
    color: fieldGuide.moss,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  closedText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wide(10),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
    includeFontPadding: false,
    flexShrink: 1,
  },
  dashText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  distText: {
    marginLeft: 8,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wide(10),
    color: fieldGuide.creamSoft,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },

  /* list */
  listContent: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 4,
    gap: 16,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: fieldGuide.inkLine,
  },
  listThumb: {
    width: 72,
    height: 72,
    borderRadius: fieldGuide.radius.md,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
    position: 'relative',
  },
  listBody: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },
  listTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: -0.005 * 16,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  listMeta: {
    marginTop: 4,
  },
  listStatusRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* empty */
  emptyWrap: {
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 22,
    letterSpacing: -0.01 * 22,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  emptyBody: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: fieldGuide.creamSoft,
    textAlign: 'center',
    maxWidth: 280,
  },

  /* fab */
  fab: {
    position: 'absolute',
    right: PAGE_PAD,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: fieldGuide.cream,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
});
