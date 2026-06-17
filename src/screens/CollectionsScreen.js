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
  ShareDispatchSheet,
  SpotPhoto,
} from '../components/fieldguide';
import fieldGuide from '../theme/fieldGuide';
import { useAuth } from '../hooks/useAuth';
import { useUserProgression } from '../hooks/useUserProgression';
import { useBadgeProgress } from '../hooks/useBadgeProgress';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import {
  getUserCollections,
  getAllCollections,
  deleteCollection,
  shareCollection,
} from '../services/collections.service';
import { getSavedSpots } from '../services/savedSpots.service';
import { getVisitedSpots } from '../services/visitedSpots.service';
import {
  indexForSpot,
  prettyCategory,
  vibeForCategory,
  zeroPad,
} from '../utils/spotHelpers';
import {
  canCreateCollections,
  getExplorerVisitProgress,
  resolveUnlockBadge,
  showCollectionsLockedToast,
} from '../utils/collectionAccess';

/* ─────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                            */
/* ─────────────────────────────────────────────────────────────────── */

const TABS = ['Collections', 'Saved spots', 'Visited spots'];

function safeArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  if (Array.isArray(maybe?.items)) return maybe.items;
  if (Array.isArray(maybe?.data)) return maybe.data;
  return [];
}

function mergeCollectionsMineFirst(mine, pub) {
  const seen = new Set();
  const merged = [];

  for (const c of mine) {
    const id = c?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push({ ...c, isMine: true });
  }

  for (const c of pub) {
    const id = c?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push({ ...c, isMine: false });
  }

  return merged;
}

function isCollectionOwner(collection, currentUserId) {
  if (!collection || !currentUserId) return false;
  return (
    collection.isMine === true ||
    collection.userId === currentUserId ||
    collection.user?.id === currentUserId
  );
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
  const [mineRes, publicRes] = await Promise.all([
    userId ? getUserCollections(userId) : Promise.resolve([]),
    getAllCollections({ isPublic: true, sortBy: 'prestige', limit: 100 }),
  ]);

  const mineErr = mineRes?.error;
  const publicErr = publicRes?.error;

  if (mineErr) logger.error('CollectionsScreen.getUserCollections', mineErr);
  if (publicErr) logger.error('CollectionsScreen.getAllCollections.public', publicErr);

  if (mineErr && publicErr) {
    throw new Error(mineErr || publicErr || 'Failed to fetch collections');
  }

  const mine = mineErr ? [] : safeArray(mineRes);
  const pub = publicErr ? [] : safeArray(publicRes);
  return mergeCollectionsMineFirst(mine, pub);
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
  const { data: progression, isLoading: loadingProgression, refetch: refetchProgression } =
    useUserProgression();
  const unlockedCreate = canCreateCollections(user, progression);
  const unlockBadge = resolveUnlockBadge(user, progression);
  const { data: badgeProgress } = useBadgeProgress({
    enabled: !!userId && !unlockedCreate && !loadingProgression,
  });

  const tryOpenCreate = useCallback(() => {
    if (unlockedCreate) {
      navigation.navigate('CreateCollection');
      return;
    }
    const progress = getExplorerVisitProgress(progression, badgeProgress, unlockBadge);
    showCollectionsLockedToast(toast, unlockBadge, progress);
  }, [
    unlockedCreate,
    navigation,
    progression,
    badgeProgress,
    unlockBadge,
    toast,
  ]);

  const [tab, setTab] = useState(0);
  const [menuFor, setMenuFor] = useState(null);
  const [shareFor, setShareFor] = useState(null);

  /* ── COLLECTIONS query ───────────────────────────────────────────── */
  const collectionsQuery = useQuery({
    queryKey: ['user-collections', userId ?? 'guest'],
    queryFn: () => fetchCollections(userId),
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
      queryClient.invalidateQueries({ queryKey: ['user-collections', userId ?? 'guest'] });
      if (userId) {
        refetchProgression();
      }
    }, [queryClient, userId, refetchProgression]),
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
  const headerSub = useMemo(() => {
    if (tab === 1) {
      const n = Array.isArray(savedSpots) ? savedSpots.length : 0;
      return `${n} SAVED SPOT${n === 1 ? '' : 'S'}`;
    }
    if (tab === 2) {
      const n = Array.isArray(visitedSpots) ? visitedSpots.length : 0;
      return `${n} VISITED SPOT${n === 1 ? '' : 'S'}`;
    }
    const spotsInPockets = totalSpotCount(collections);
    return `${collections.length} COLLECTION${
      collections.length === 1 ? '' : 'S'
    } · ${spotsInPockets} SPOT${spotsInPockets === 1 ? '' : 'S'}`;
  }, [tab, collections, savedSpots, visitedSpots]);

  /* ── menu actions ────────────────────────────────────────────────── */
  const openMenu = (collection) => setMenuFor(collection);
  const closeMenu = () => setMenuFor(null);

  const handleEdit = (id) => {
    if (!menuFor || !isCollectionOwner(menuFor, userId)) return;
    if (!unlockedCreate) {
      const progress = getExplorerVisitProgress(progression, badgeProgress, unlockBadge);
      showCollectionsLockedToast(toast, unlockBadge, progress);
      return;
    }
    navigation.navigate('CreateCollection', { id, mode: 'edit' });
  };

  const handleShare = () => {
    if (!menuFor) return;
    if (!menuFor.isPublic) {
      toast.show('Private pockets cannot be shared.', { variant: 'info' });
      closeMenu();
      return;
    }
    const target = menuFor;
    closeMenu();
    setShareFor(target);
  };

  const handleShareRecorded = () => {
    if (shareFor?.id) shareCollection(shareFor.id).catch(() => {});
  };

  const handleDelete = async (id) => {
    if (!menuFor || !isCollectionOwner(menuFor, userId)) return;
    // Optimistic removal — pop from cache, roll back on error.
    const snapshot = collections;
    queryClient.setQueryData(
      ['user-collections', userId],
      snapshot.filter((c) => c?.id !== id),
    );
    try {
      const result = await deleteCollection(id);
      if (result?.error) {
        if (result.code === 'COLLECTIONS_CREATE_LOCKED') {
          const progress = getExplorerVisitProgress(progression, badgeProgress, unlockBadge);
          showCollectionsLockedToast(toast, result.unlockBadge ?? unlockBadge, progress);
          queryClient.setQueryData(['user-collections', userId], snapshot);
          return;
        }
        throw new Error(result.error);
      }
      toast.show('Pocket deleted.', { variant: 'success' });
    } catch (err) {
      logger.error('CollectionsScreen.deleteCollection', err);
      queryClient.setQueryData(['user-collections', userId], snapshot);
      toast.show('Could not delete the pocket.', { variant: 'error' });
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
            pageName="POCKET"
            title="Nothing tucked away yet"
            italic="yet."
            body="A pocket holds a few spots that belong together — rainy-day cafés, places you save for visitors, the quiet ones for working."
            cta={{
              label: 'Start a pocket',
              onPress: tryOpenCreate,
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
            onLongPress={
              isCollectionOwner(item, userId)
                ? () => openMenu(item)
                : undefined
            }
            onMenuPress={
              isCollectionOwner(item, userId)
                ? () => openMenu(item)
                : undefined
            }
            canShowMenu={isCollectionOwner(item, userId)}
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
            Pocket
          </DisplayTitle>
          <EditorialButton
            variant="cream"
            size="sm"
            leading={<Ionicons name="add" size={14} color={fieldGuide.ink} />}
            onPress={tryOpenCreate}
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
            'Nothing saved yet.',
            'Tap the bookmark on any spot card to save it here — then group your favorites into a pocket once you unlock Explorer.',
          )}
        {tab === 2 &&
          renderSpotGrid(
            visitedSpots,
            visitedLoading,
            'No visits logged yet.',
            'Mark a spot as visited from its detail screen and we\'ll keep a quiet record here.',
          )}
      </View>

      <CollectionMenuSheet
        visible={!!menuFor}
        collection={menuFor}
        isOwner={isCollectionOwner(menuFor, userId)}
        onClose={closeMenu}
        onEdit={handleEdit}
        onShare={handleShare}
        onDelete={handleDelete}
      />

      <ShareDispatchSheet
        visible={!!shareFor}
        onClose={() => setShareFor(null)}
        variant="collection"
        collection={shareFor}
        userName={user?.name || user?.displayName || ''}
        onShared={handleShareRecorded}
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
