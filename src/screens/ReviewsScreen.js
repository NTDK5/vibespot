/**
 * ReviewsScreen — Phase 4 / design 14.
 *
 * Lists every review for a spot, with a rating-distribution summary
 * and a filter pill row. Driven by getSpotComments(spotId, page, 20)
 * with infinite-scroll pagination on the FlatList footer.
 *
 * Filters are state-driven on top of the loaded list. Buckets in the
 * summary are computed client-side: counts[rating-1] += 1. When the
 * current backend payload lacks a `rating` field every bucket is 0;
 * once ratings ship the bars come alive automatically.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  EditorialButton,
  EmptyState,
  FullReviewCard,
  MonoMeta,
  Pill,
} from '../components/fieldguide';
import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import {
  createComment,
  getSpotComments,
} from '../services/comments.service';
import { getSpotById } from '../services/spots.service';
import { indexForSpot, zeroPad } from '../utils/spotHelpers';
import { useAuth } from '../hooks/useAuth';
import { getDisplayableReviewPhotos } from '../utils/reviewPhotos';
import { isSpotVisited } from '../services/visitedSpots.service';
import { tryNavigateToWriteReview } from '../utils/reviewAccess';

const PAGE_SIZE = 20;

const FILTERS = [
  { id: 'all',    label: 'ALL',          inert: false },
  { id: 'recent', label: 'RECENT',       inert: false },
  { id: 'photos', label: 'WITH PHOTOS',  inert: false },
  { id: 'fives',  label: '5 STARS',      inert: false },
  { id: 'visitors', label: 'VISITORS',   inert: false },
  { id: 'locals', label: 'LOCALS',       inert: false },
];

function safeArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  if (Array.isArray(maybe?.comments)) return maybe.comments;
  if (Array.isArray(maybe?.items)) return maybe.items;
  if (Array.isArray(maybe?.data)) return maybe.data;
  return [];
}

function isInertFor(filter, reviews) {
  if (filter === 'photos') {
    return !reviews.some((r) => getDisplayableReviewPhotos(r).length > 0);
  }
  if (filter === 'fives') {
    return !reviews.some((r) => typeof r?.rating === 'number');
  }
  if (filter === 'visitors' || filter === 'locals') {
    return !reviews.some((r) => typeof r?.user?.isLocal === 'boolean');
  }
  return false;
}

function applyFilter(filter, reviews) {
  switch (filter) {
    case 'recent':
      return [...reviews].sort((a, b) => {
        const ta = new Date(a?.createdAt || a?.timestamp || 0).getTime();
        const tb = new Date(b?.createdAt || b?.timestamp || 0).getTime();
        return tb - ta;
      });
    case 'photos':
      return reviews.filter((r) => getDisplayableReviewPhotos(r).length > 0);
    case 'fives':
      return reviews.filter(
        (r) => typeof r?.rating === 'number' && Math.round(r.rating) === 5,
      );
    case 'visitors':
      return reviews.filter((r) => r?.user?.isLocal === false);
    case 'locals':
      return reviews.filter((r) => r?.user?.isLocal === true);
    default:
      return reviews;
  }
}

export const ReviewsScreen = ({ navigation, route }) => {
  const spotId = route?.params?.spotId ?? route?.params?.id;
  const toast = useToast();
  const { user } = useAuth();

  const [spot, setSpot] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [visited, setVisited] = useState(false);

  // ── load spot header ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!spotId) return;
      try {
        const data = await getSpotById(spotId);
        if (cancelled) return;
        if (!data?.error) setSpot(data);
      } catch (err) {
        logger.error('Reviews.getSpot', err);
      }
    })();
    return () => { cancelled = true; };
  }, [spotId]);

  // ── load reviews ─────────────────────────────────────────────────
  const loadPage = useCallback(async (nextPage) => {
    if (!spotId) return;
    if (nextPage === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const payload = await getSpotComments(spotId, nextPage, PAGE_SIZE);
      if (payload?.error) {
        logger.error('Reviews.getSpotComments', payload.error);
        setHasMore(false);
      } else {
        const arr = safeArray(payload?.comments ?? payload);
        const meta = payload?.meta;
        setReviews((prev) => (nextPage === 1 ? arr : [...prev, ...arr]));

        if (Number.isFinite(meta?.totalPages)) {
          setHasMore(nextPage < meta.totalPages);
        } else {
          setHasMore(arr.length >= PAGE_SIZE);
        }

        setPage(nextPage);
      }
    } catch (err) {
      logger.error('Reviews.loadPage', err);
      setHasMore(false);
    } finally {
      if (nextPage === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, [spotId]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!spotId || !user) {
        if (!cancelled) setVisited(false);
        return;
      }
      try {
        const v = await isSpotVisited(spotId);
        if (!cancelled) setVisited(!!v);
      } catch (err) {
        logger.error('Reviews.isSpotVisited', err);
        if (!cancelled) setVisited(false);
      }
    })();
    return () => { cancelled = true; };
  }, [spotId, user]);

  const handleWriteReview = useCallback(() => {
    tryNavigateToWriteReview({
      navigation,
      spotId,
      visited,
      toast,
      user,
    });
  }, [navigation, spotId, visited, toast, user]);

  const onEndReached = () => {
    if (loading || loadingMore || !hasMore) return;
    loadPage(page + 1);
  };

  // ── derived stats ────────────────────────────────────────────────
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const rating = Number(r?.rating);
      if (rating >= 1 && rating <= 5) counts[Math.round(rating) - 1] += 1;
    });
    return counts;
  }, [reviews]);
  const total = reviews.length;
  const maxCount = Math.max(1, ...distribution);
  const avg = useMemo(() => {
    if (spot?.averageRating != null) return Number(spot.averageRating);
    if (!total) return 0;
    const ratings = reviews
      .map((r) => Number(r?.rating))
      .filter((n) => n >= 1 && n <= 5);
    if (!ratings.length) return 0;
    return ratings.reduce((s, n) => s + n, 0) / ratings.length;
  }, [reviews, spot, total]);

  // ── filters ──────────────────────────────────────────────────────
  const filtered = useMemo(
    () => applyFilter(filter, reviews),
    [filter, reviews],
  );
  const displayFilters = useMemo(() => {
    return FILTERS.map((f) => {
      const inert = f.id !== 'all' && f.id !== 'recent' && isInertFor(f.id, reviews);
      return { ...f, inert };
    });
  }, [reviews]);

  const onFilterPress = (f) => {
    if (f.id === 'all') {
      setFilter('all');
      return;
    }
    if (f.inert) {
      toast.show('Coming soon — needs richer review data.', { variant: 'info' });
      return;
    }
    setFilter(f.id);
  };

  // ── reply handler ────────────────────────────────────────────────
  const handleReply = useCallback(async (reviewId) => {
    // TODO(backend): parentId/threading not yet supported by the API.
    // Surface an informational toast for now so the affordance is
    // discoverable when threading lands.
    toast.show('Replies are coming soon.', { variant: 'info' });
    // Keep createComment imported so this stays a one-line wiring once
    // the backend grows a parentId parameter.
    void createComment;
    void reviewId;
    void user;
  }, [toast, user]);

  // ── render ───────────────────────────────────────────────────────
  if (!spotId) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <EmptyState
          title="No spot selected."
          body="Open a spot first, then tap the reviews link."
          cta={{ label: 'Back', onPress: () => navigation.goBack() }}
        />
      </SafeAreaView>
    );
  }

  const indexLabel = `NO. ${zeroPad(indexForSpot(spot || { id: spotId }, 0), 3)}`;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.topbar}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.backBtn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={16} color={fieldGuide.cream} />
        </Pressable>
        <View style={styles.topbarCenter}>
          <MonoMeta size="eyebrow">{indexLabel}</MonoMeta>
          <Text style={styles.topbarTitle} numberOfLines={1}>
            {spot?.title || 'Reviews'}
          </Text>
        </View>
        <EditorialButton
          size="sm"
          variant="primary"
          onPress={handleWriteReview}
        >
          + Write
        </EditorialButton>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => String(item?.id || i)}
        renderItem={({ item }) => (
          <FullReviewCard
            review={item}
            onReply={handleReply}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            <View style={styles.summary}>
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryBig}>
                  {avg > 0 ? avg.toFixed(1) : '—'}
                  <Text style={styles.summarySmall}>/5</Text>
                </Text>
                <MonoMeta size="spot" style={{ marginTop: 4 }}>
                  {`${total} REVIEW${total === 1 ? '' : 'S'}`}
                </MonoMeta>
              </View>
              <View style={styles.summaryBars}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star - 1];
                  const fillPct = (count / maxCount) * 100;
                  return (
                    <View key={star} style={styles.barRow}>
                      <Text style={styles.barLabel}>{star}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${fillPct}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.barCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterRowWrap}>
              <FlatList
                data={displayFilters}
                keyExtractor={(f) => f.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item: f }) => {
                  const isActive =
                    (f.id === 'all' && filter === 'all') || filter === f.id;
                  return (
                    <Pill
                      variant={isActive ? 'ember' : 'default'}
                      dot={isActive}
                      onPress={() => onFilterPress(f)}
                      style={f.inert ? styles.pillInert : null}
                    >
                      {f.id === 'all' ? `ALL · ${total}` : f.label}
                    </Pill>
                  );
                }}
                ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingPad}>
              <ActivityIndicator color={fieldGuide.ember} />
            </View>
          ) : (
            <View style={styles.emptyPad}>
              <EmptyState
                title="No reviews match this filter."
                italic="filter"
                body="Switch back to ALL, or be the first to leave a stamp on this spot."
                cta={{
                  label: 'Write a review',
                  onPress: handleWriteReview,
                }}
              />
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerPad}>
              <ActivityIndicator color={fieldGuide.ember} />
            </View>
          ) : (
            <View style={{ height: 40 }} />
          )
        }
      />
    </SafeAreaView>
  );
};

export default ReviewsScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  topbar: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  topbarTitle: {
    marginTop: 2,
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 16,
    color: fieldGuide.cream,
    letterSpacing: -0.005 * 16,
    includeFontPadding: false,
  },

  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },

  summary: {
    marginHorizontal: -22,
    paddingHorizontal: 22,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  summaryLeft: {
    minWidth: 96,
  },
  summaryBig: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 64,
    lineHeight: 64,
    color: fieldGuide.cream,
    letterSpacing: -0.03 * 64,
    includeFontPadding: false,
  },
  summarySmall: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 18,
    color: fieldGuide.creamMute,
  },
  summaryBars: {
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabel: {
    width: 14,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    color: fieldGuide.creamMute,
  },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: fieldGuide.inkLine,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: fieldGuide.ember,
  },
  barCount: {
    width: 28,
    textAlign: 'right',
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    color: fieldGuide.creamMute,
  },

  filterRowWrap: {
    marginHorizontal: -22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  filterRow: {
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  pillInert: {
    opacity: 0.45,
  },

  loadingPad: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyPad: {
    paddingVertical: 24,
  },
  footerPad: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});
