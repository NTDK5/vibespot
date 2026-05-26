/**
 * CollectionsScreen — Phase 4 / design 10 (Field Guide rewrite).
 *
 * Three tabs share the same masthead:
 *   0  Collections   — list of mosaic cover cards
 *   1  All spots     — saved-spot library (2-col grid)
 *   2  Visited       — visited-spot history (2-col grid)
 *
 * Data flow:
 *   - useQuery wraps `getUserCollections(user.id)`. If the per-user
 *     endpoint returns an empty payload, fall back to
 *     `getAllCollections({ userId: user.id })`.
 *   - Saved / Visited lists are lazy-loaded the first time the user
 *     visits each tab and cached on the component instance.
 *   - Pull-to-refresh invalidates whatever the current tab needs.
 *
 * Constraints:
 *   - Only fieldguide primitives for chrome / typography / cards.
 *   - All errors funnelled through `logger.error`.
 *   - Long-press / kebab → CollectionMenuSheet → CreateCollection in
 *     edit mode, or destructive delete with a confirm.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  DisplayTitle,
  EditorialButton,
  EmptyState,
  MonoMeta,
  Segmented,
  CollectionCard,
  CollectionMenuSheet,
  SpotPhoto,
} from '../components/fieldguide';
import fieldGuide from '../theme/fieldGuide';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import {
  getUserCollections,
  getAllCollections,
  deleteCollection,
} from '../services/collections.service';
import { getSavedSpots } from '../services/savedSpots.service';
import { getVisitedSpots } from '../services/visitedSpots.service';
import {
  indexForSpot,
  prettyCategory,
  vibeForCategory,
  zeroPad,
} from '../utils/spotHelpers';

/* ─────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                            */
/* ─────────────────────────────────────────────────────────────────── */

const TABS = ['Collections', 'All spots', 'Visited'];

function safeArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  if (Array.isArray(maybe?.items)) return maybe.items;
  if (Array.isArray(maybe?.data)) return maybe.data;
  return [];
}

function unwrapSavedRow(row) {
  // savedSpots endpoint sometimes returns join rows shaped { spot: {...} }.
  return row?.spot && row?.spot?.id ? row.spot : row;
}

function totalSpotCount(collections) {
  return collections.reduce((n, c) => {
    if (typeof c?.spotCount === 'number') return n + c.spotCount;
    if (Array.isArray(c?.spots)) return n + c.spots.length;
    return n;
  }, 0);
}

async function fetchCollections(userId) {
  // Try per-user first; fall back to /collections?userId= if empty/error.
  const primary = await getUserCollections(userId);
  const fromPrimary = safeArray(primary);
  if (!primary?.error && fromPrimary.length) return fromPrimary;

  const fallback = await getAllCollections({ userId, sortBy: 'recent', limit: 50 });
  if (fallback?.error) {
    // Surface the most specific error we have so the UI can react.
    const err = new Error(primary?.error || fallback.error);
    throw err;
  }
  return safeArray(fallback);
}

/* ─────────────────────────────────────────────────────────────────── */
/*  COMPACT GRID CARD (used by All spots / Visited tabs)                */
/* ─────────────────────────────────────────────────────────────────── */

function SpotGridCard({ spot, fallbackIndex, onPress }) {
  const idxLabel = `NO. ${zeroPad(indexForSpot(spot) ?? fallbackIndex, 3)}`;
  const vibe = vibeForCategory(spot?.category);
  const district = spot?.district || spot?.city;
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
        vibe={vibe}
        image={spot?.thumbnail ? { uri: spot.thumbnail } : undefined}
        aspect="3/4"
        index={idxLabel}
      />
      <Text style={styles.gridTitle} numberOfLines={2}>
        {spot?.title || 'Untitled'}
      </Text>
      <MonoMeta size="spot" style={styles.gridMeta}>
        {[prettyCategory(spot?.category), district].filter(Boolean).join('  ·  ')}
      </MonoMeta>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SCREEN                                                             */
/* ─────────────────────────────────────────────────────────────────── */

export const CollectionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const [tab, setTab] = useState(0);
  const [menuFor, setMenuFor] = useState(null);

  /* ── COLLECTIONS query ───────────────────────────────────────────── */
  const collectionsQuery = useQuery({
    queryKey: ['user-collections', userId],
    queryFn: () => fetchCollections(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const collections = useMemo(
    () => safeArray(collectionsQuery.data),
    [collectionsQuery.data],
  );

  /* ── SAVED + VISITED (lazy) ──────────────────────────────────────── */
  const [savedSpots, setSavedSpots] = useState(null);
  const [visitedSpots, setVisitedSpots] = useState(null);
  const [savedLoading, setSavedLoading] = useState(false);
  const [visitedLoading, setVisitedLoading] = useState(false);

  const loadSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const data = await getSavedSpots();
      if (data?.error) {
        logger.error('CollectionsScreen.getSavedSpots', data.error);
        setSavedSpots([]);
      } else {
        setSavedSpots(safeArray(data).map(unwrapSavedRow).filter(Boolean));
      }
    } catch (err) {
      logger.error('CollectionsScreen.getSavedSpots', err);
      setSavedSpots([]);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  const loadVisited = useCallback(async () => {
    setVisitedLoading(true);
    try {
      const data = await getVisitedSpots();
      if (data?.error) {
        logger.error('CollectionsScreen.getVisitedSpots', data.error);
        setVisitedSpots([]);
      } else {
        setVisitedSpots(safeArray(data).map(unwrapSavedRow).filter(Boolean));
      }
    } catch (err) {
      logger.error('CollectionsScreen.getVisitedSpots', err);
      setVisitedSpots([]);
    } finally {
      setVisitedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 1 && savedSpots == null && !savedLoading) loadSaved();
    if (tab === 2 && visitedSpots == null && !visitedLoading) loadVisited();
  }, [tab, savedSpots, visitedSpots, savedLoading, visitedLoading, loadSaved, loadVisited]);

  /* ── refresh when screen regains focus ───────────────────────────── */
  useFocusEffect(
    useCallback(() => {
      // Refetch collections lightly so a new pocket created on a sibling
      // screen shows up without a manual pull.
      queryClient.invalidateQueries({ queryKey: ['user-collections', userId] });
    }, [queryClient, userId]),
  );

  /* ── pull-to-refresh ─────────────────────────────────────────────── */
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (tab === 0) {
        await collectionsQuery.refetch();
      } else if (tab === 1) {
        await loadSaved();
      } else if (tab === 2) {
        await loadVisited();
      }
    } finally {
      setRefreshing(false);
    }
  }, [tab, collectionsQuery, loadSaved, loadVisited]);

  /* ── header counts ───────────────────────────────────────────────── */
  const totalSaved = useMemo(() => {
    const c = totalSpotCount(collections);
    if (c > 0) return c;
    return Array.isArray(savedSpots) ? savedSpots.length : 0;
  }, [collections, savedSpots]);

  const headerSub = `${collections.length} COLLECTION${
    collections.length === 1 ? '' : 'S'
  } · ${totalSaved} SPOT${totalSaved === 1 ? '' : 'S'} IN YOUR POCKET`;

  /* ── menu actions ────────────────────────────────────────────────── */
  const openMenu = (collection) => setMenuFor(collection);
  const closeMenu = () => setMenuFor(null);

  const handleEdit = (id) => {
    navigation.navigate('CreateCollection', { id, mode: 'edit' });
  };

  const handleShare = () => {
    toast.show('Sharing collections is coming soon.', { variant: 'info' });
  };

  const handleDelete = async (id) => {
    // Optimistic removal — pop from cache, roll back on error.
    const snapshot = collections;
    queryClient.setQueryData(
      ['user-collections', userId],
      snapshot.filter((c) => c?.id !== id),
    );
    try {
      const result = await deleteCollection(id);
      if (result?.error) throw new Error(result.error);
      toast.show('Collection deleted.', { variant: 'success' });
    } catch (err) {
      logger.error('CollectionsScreen.deleteCollection', err);
      queryClient.setQueryData(['user-collections', userId], snapshot);
      toast.show('Could not delete the collection.', { variant: 'error' });
    }
  };

  /* ── render helpers ──────────────────────────────────────────────── */
  const renderCollections = () => {
    if (collectionsQuery.isLoading && collections.length === 0) {
      return (
        <View style={styles.loadingPad}>
          <ActivityIndicator color={fieldGuide.ember} />
        </View>
      );
    }
    if (!collections.length) {
      return (
        <View style={styles.emptyPad}>
          <EmptyState
            title="No pockets yet."
            italic="yet."
            body="A collection holds a few spots that belong together — rainy-day cafés, places you save for visitors, the quiet ones for working."
            cta={{
              label: 'Start one',
              onPress: () => navigation.navigate('CreateCollection'),
            }}
          />
        </View>
      );
    }
    return (
      <FlatList
        data={collections}
        keyExtractor={(item, i) => String(item?.id || i)}
        renderItem={({ item }) => (
          <CollectionCard
            collection={item}
            onPress={() =>
              navigation.navigate('CollectionDetail', { id: item.id })
            }
            onLongPress={() => openMenu(item)}
            onMenuPress={() => openMenu(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={fieldGuide.ember}
          />
        }
      />
    );
  };

  const renderSpotGrid = (spots, loading, emptyTitle, emptyBody) => {
    if (loading && (!spots || spots.length === 0)) {
      return (
        <View style={styles.loadingPad}>
          <ActivityIndicator color={fieldGuide.ember} />
        </View>
      );
    }
    if (!spots || spots.length === 0) {
      return (
        <View style={styles.emptyPad}>
          <EmptyState title={emptyTitle} italic="yet." body={emptyBody} />
        </View>
      );
    }
    return (
      <FlatList
        data={spots}
        keyExtractor={(item, i) => String(item?.id || i)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item, index }) => (
          <View style={styles.gridCell}>
            <SpotGridCard
              spot={item}
              fallbackIndex={index + 1}
              onPress={() =>
                navigation.navigate('SpotDetail', { spotId: item?.id })
              }
            />
          </View>
        )}
        contentContainerStyle={styles.gridContent}
        ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={fieldGuide.ember}
          />
        }
      />
    );
  };

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.head}>
        <View style={styles.row1}>
          <DisplayTitle size="lg" weight="500">
            Saved spots
          </DisplayTitle>
          <EditorialButton
            variant="cream"
            size="sm"
            leading={<Ionicons name="add" size={14} color={fieldGuide.ink} />}
            onPress={() => navigation.navigate('CreateCollection')}
          >
            NEW
          </EditorialButton>
        </View>
        <MonoMeta size="eyebrow" style={styles.headSub}>
          {headerSub}
        </MonoMeta>
      </View>

      <View style={styles.segRow}>
        <Segmented items={TABS} value={tab} onChange={setTab} />
      </View>

      <View style={styles.body}>
        {tab === 0 && renderCollections()}
        {tab === 1 &&
          renderSpotGrid(
            savedSpots,
            savedLoading,
            'Nothing tucked away yet.',
            'Tap the bookmark on any spot card to add it to your library — then build a pocket out of the ones that belong together.',
          )}
        {tab === 2 &&
          renderSpotGrid(
            visitedSpots,
            visitedLoading,
            'No visits logged yet.',
            'Mark a spot as visited from its detail screen and we’ll keep a quiet record here.',
          )}
      </View>

      <CollectionMenuSheet
        visible={!!menuFor}
        collection={menuFor}
        onClose={closeMenu}
        onEdit={handleEdit}
        onShare={handleShare}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
};

export default CollectionsScreen;

const TAB_BAR_PAD = 100;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  head: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 18,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headSub: {
    marginTop: 6,
  },
  segRow: {
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  body: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: TAB_BAR_PAD,
  },
  gridContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: TAB_BAR_PAD,
  },
  gridRow: {
    gap: 12,
  },
  gridCell: {
    flex: 1,
  },
  loadingPad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyPad: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: TAB_BAR_PAD,
  },
  gridCard: {
    flexDirection: 'column',
  },
  gridTitle: {
    marginTop: 10,
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 15.5,
    lineHeight: 18.5,
    letterSpacing: -0.005 * 15.5,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  gridMeta: {
    marginTop: 3,
  },
});
