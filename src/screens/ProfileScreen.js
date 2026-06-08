/**
 * ProfileScreen — Phase 5 / design 19.
 *
 * Identity, stats, achievement seals, and tabbed activity feed.
 * Settings, password, and sign-out live on SettingsScreen.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MonoMeta from '../components/fieldguide/primitives/MonoMeta';
import EditorialButton from '../components/fieldguide/form/EditorialButton';
import Segmented from '../components/fieldguide/chrome/Segmented';
import EmptyState from '../components/fieldguide/state/EmptyState';
import AchievementSeal from '../components/fieldguide/profile/AchievementSeal';
import ReviewRow from '../components/fieldguide/spot/ReviewRow';
import { XPBadgeCelebration } from '../components/ui/XPBadgeCelebration';
import fieldGuide from '../theme/fieldGuide';
import { useAuth } from '../hooks/useAuth';
import { useUserProgression } from '../hooks/useUserProgression';
import { useBadgeProgress } from '../hooks/useBadgeProgress';
import { getSavedSpots } from '../services/savedSpots.service';
import { getVisitedSpots } from '../services/visitedSpots.service';
import { getUserCollections } from '../services/collections.service';
import { getMyReviews } from '../services/user.service';
import { initialFor } from '../utils/spotHelpers';
import { logger } from '../utils/logger';

const SEEN_SEALS_KEY = 'fena.seenSealIds';

function usernameFromUser(user) {
  if (user?.username) return user.username;
  const email = user?.email || '';
  const prefix = email.split('@')[0];
  return prefix || 'explorer';
}

function readerNumberFromUser(user) {
  if (user?.readerNumber != null) {
    return String(user.readerNumber).padStart(3, '0');
  }
  const raw = String(user?.id || '');
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 2) return digits.slice(-3).padStart(3, '0');
  return '001';
}

function formatVisitDate(input) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function StatCell({ number, label, trend }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statNumber}>{String(number ?? '—')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend ? <Text style={styles.statTrend}>{trend}</Text> : null}
    </View>
  );
}

function ProfileInlineEmpty({ title }) {
  return (
    <View style={styles.inlineEmpty}>
      <Text style={styles.inlineEmptyTitle}>{title}</Text>
    </View>
  );
}

function ActivityRow({ icon, iconBg, title, meta, preview, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.activityRow,
        pressed && onPress ? { opacity: 0.85 } : null,
      ]}
    >
      <View style={[styles.activityIcon, iconBg && { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={fieldGuide.cream} />
      </View>
      <View style={styles.activityBody}>
        <Text style={styles.activityTitle} numberOfLines={2}>
          {title}
        </Text>
        {meta ? <MonoMeta size="spot">{meta}</MonoMeta> : null}
        {preview ? (
          <Text style={styles.activityPreview} numberOfLines={2}>
            {preview}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={fieldGuide.creamMute} />
      ) : null}
    </Pressable>
  );
}

function SavedSpotRow({ spot, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.savedRow,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.savedDot} />
      <View style={styles.savedBody}>
        <Text style={styles.savedTitle} numberOfLines={1}>
          {spot?.title || 'Untitled spot'}
        </Text>
        <MonoMeta size="spot">
          {spot?.category ? String(spot.category).toUpperCase() : 'SPOT'}
        </MonoMeta>
      </View>
      <Ionicons name="chevron-forward" size={16} color={fieldGuide.creamMute} />
    </Pressable>
  );
}

export const ProfileScreen = ({ navigation }) => {
  const {
    user,
    isSuperAdmin,
    isSpotOwner,
    isSpotOwnerPending,
    canManageOwnSpots,
  } = useAuth();
  const [tab, setTab] = useState(0);
  const [savedSpots, setSavedSpots] = useState([]);
  const [visitedSpots, setVisitedSpots] = useState([]);
  const [myCollections, setMyCollections] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsError, setReviewsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: progression,
    isLoading: loadingProgression,
    refetch: refetchProgression,
  } = useUserProgression();

  const badges = useMemo(() => {
    const all = Array.isArray(progression?.badges) ? progression.badges : [];
    return all.length ? all : [];
  }, [progression]);

  const unlockedBadges = useMemo(
    () => badges.filter((b) => b.unlocked),
    [badges],
  );

  const hasOnlyEntryBadge = useMemo(() => {
    if (!unlockedBadges.length) return false;
    if (unlockedBadges.length !== 1) return false;
    return unlockedBadges[0]?.name === 'Welcome Explorer';
  }, [unlockedBadges]);

  const { data: badgeProgress, isLoading: loadingBadgeProgress } = useBadgeProgress({
    enabled: !!hasOnlyEntryBadge,
  });

  // Contextual seals: only surface the strip on first login ever, or when a
  // new seal has been unlocked since the user last looked. Seen ids persist in
  // AsyncStorage so a default Profile open keeps the strip hidden.
  const unlockedSealIds = useMemo(
    () =>
      unlockedBadges
        .map((b) => String(b?.id ?? b?.name ?? ''))
        .filter(Boolean),
    [unlockedBadges],
  );
  const seenSealsRef = useRef(null);
  const [seenLoaded, setSeenLoaded] = useState(false);
  const [revealSeals, setRevealSeals] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      let parsed = null;
      try {
        const raw = await AsyncStorage.getItem(SEEN_SEALS_KEY);
        if (raw != null) {
          const arr = JSON.parse(raw);
          parsed = Array.isArray(arr) ? arr.map(String) : [];
        }
      } catch (error) {
        parsed = null;
      }
      if (!active) return;
      seenSealsRef.current = parsed; // null === key never written (first login)
      setSeenLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loadingProgression || !seenLoaded) return;
    const seen = seenSealsRef.current;
    const firstLogin = seen == null;
    const seenSet = new Set(Array.isArray(seen) ? seen : []);
    const newSeals = unlockedSealIds.filter((id) => !seenSet.has(id));
    if (!firstLogin && newSeals.length === 0) return;

    setRevealSeals(true);
    const union = Array.from(
      new Set([...(Array.isArray(seen) ? seen : []), ...unlockedSealIds]),
    );
    seenSealsRef.current = union;
    AsyncStorage.setItem(SEEN_SEALS_KEY, JSON.stringify(union)).catch(() => {});
  }, [loadingProgression, seenLoaded, unlockedSealIds]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const pct =
      typeof badgeProgress?.percentage === 'number'
        ? badgeProgress.percentage
        : 0;
    Animated.timing(progressAnim, {
      toValue: Math.max(0, Math.min(100, pct)),
      duration: 650,
      useNativeDriver: false,
    }).start();
  }, [badgeProgress, progressAnim]);

  const [lastBadgeId, setLastBadgeId] = useState(null);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);

  useEffect(() => {
    if (
      progression?.newestBadge?.id &&
      progression.newestBadge.id !== lastBadgeId
    ) {
      setShowBadgeCelebration(true);
      setLastBadgeId(progression.newestBadge.id);
    }
  }, [progression, lastBadgeId]);

  const loadSavedSpots = useCallback(async () => {
    try {
      const spots = await getSavedSpots();
      if (!spots?.error) {
        setSavedSpots(Array.isArray(spots) ? spots : []);
      }
    } catch (error) {
      logger.error('Profile.loadSaved', error);
    }
  }, []);

  const loadVisitedSpots = useCallback(async () => {
    try {
      const spots = await getVisitedSpots();
      if (!spots?.error) {
        setVisitedSpots(Array.isArray(spots) ? spots : []);
      }
    } catch (error) {
      logger.error('Profile.loadVisited', error);
    }
  }, []);

  const loadMyCollections = useCallback(async () => {
    if (!user?.id) return;
    try {
      const collections = await getUserCollections(user.id);
      if (!collections?.error) {
        setMyCollections(Array.isArray(collections) ? collections : []);
      }
    } catch (error) {
      logger.error('Profile.loadCollections', error);
    }
  }, [user?.id]);

  const loadMyReviews = useCallback(async () => {
    try {
      const data = await getMyReviews();
      if (data?.error) {
        setReviewsError(true);
        setMyReviews([]);
        return;
      }
      setReviewsError(false);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.reviews)
          ? data.reviews
          : [];
      setMyReviews(list);
    } catch (error) {
      setReviewsError(true);
      setMyReviews([]);
      logger.error('Profile.loadReviews', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSavedSpots();
      loadVisitedSpots();
      loadMyCollections();
      loadMyReviews();
    }
  }, [
    user,
    loadSavedSpots,
    loadVisitedSpots,
    loadMyCollections,
    loadMyReviews,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadSavedSpots(),
        loadVisitedSpots(),
        loadMyCollections(),
        loadMyReviews(),
        refetchProgression(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const reviewCount = useMemo(() => {
    if (typeof progression?.stats?.reviews === 'number') {
      return progression.stats.reviews;
    }
    if (typeof progression?.reviewCount === 'number') {
      return progression.reviewCount;
    }
    if (!reviewsError) return myReviews.length;
    return 0;
  }, [progression, reviewsError, myReviews.length]);

  const visitedTrend =
    typeof progression?.stats?.visitedThisMonth === 'number' &&
    progression.stats.visitedThisMonth > 0
      ? `↑ ${progression.stats.visitedThisMonth} this month`
      : null;

  const savedTrend =
    typeof progression?.stats?.savedThisMonth === 'number' &&
    progression.stats.savedThisMonth > 0
      ? `↑ ${progression.stats.savedThisMonth} this month`
      : null;

  const reviewTrend =
    typeof progression?.stats?.reviewsThisMonth === 'number' &&
    progression.stats.reviewsThisMonth > 0
      ? `↑ ${progression.stats.reviewsThisMonth} this month`
      : null;

  const xpValue = toNumber(
    progression?.xp ??
      progression?.currentXp ??
      progression?.stats?.xp,
    0,
  );
  const levelValue = Math.max(
    1,
    toNumber(progression?.level ?? progression?.currentLevel, 1),
  );
  const nextLevelXp = Math.max(
    xpValue + 1,
    toNumber(progression?.nextLevelXp ?? progression?.xpToNextLevel, levelValue * 100),
  );
  const prevLevelXp = Math.max(
    0,
    toNumber(progression?.prevLevelXp ?? progression?.levelStartXp, (levelValue - 1) * 100),
  );
  const xpSpan = Math.max(1, nextLevelXp - prevLevelXp);
  const xpIntoLevel = Math.max(0, Math.min(xpSpan, xpValue - prevLevelXp));
  const xpPercent = Math.round((xpIntoLevel / xpSpan) * 100);

  const activityItems = useMemo(() => {
    const items = [];

    visitedSpots.slice(0, 5).forEach((entry) => {
      const spot = entry?.spot || entry;
      const spotId = spot?.id || entry?.spotId;
      const when = formatVisitDate(entry?.visitedAt || entry?.createdAt);
      items.push({
        id: `visit-${spotId || entry?.id}`,
        sortAt: new Date(entry?.visitedAt || entry?.createdAt || 0).getTime(),
        icon: 'footsteps-outline',
        title: spot?.title || 'Visited spot',
        meta: when ? `Visited · ${when}` : 'Visited',
        preview: spot?.address || null,
        onPress: spotId
          ? () => navigation.navigate('SpotDetail', { spotId })
          : undefined,
      });
    });

    [...myCollections]
      .sort(
        (a, b) =>
          new Date(b?.updatedAt || b?.createdAt || 0) -
          new Date(a?.updatedAt || a?.createdAt || 0),
      )
      .slice(0, 3)
      .forEach((col) => {
        items.push({
          id: `col-${col.id}`,
          sortAt: new Date(col?.updatedAt || col?.createdAt || 0).getTime(),
          icon: 'albums-outline',
          iconBg: fieldGuide.moss,
          title: col.title || 'Untitled collection',
          meta: `Collection · ${col.spotCount || 0} spots`,
          preview: col.description || null,
          onPress: () =>
            navigation.navigate('CollectionDetail', {
              collectionId: col.id,
            }),
        });
      });

    if (Array.isArray(progression?.recentEvents)) {
      progression.recentEvents.forEach((ev, i) => {
        items.push({
          id: `ev-${ev.id || i}`,
          sortAt: new Date(ev?.createdAt || 0).getTime(),
          icon: 'sparkles-outline',
          title: ev.title || ev.message || 'Activity',
          meta: ev.meta || '',
          preview: ev.preview || null,
          onPress: ev.spotId
            ? () =>
                navigation.navigate('SpotDetail', { spotId: ev.spotId })
            : undefined,
        });
      });
    }

    return items.sort((a, b) => (b.sortAt || 0) - (a.sortAt || 0));
  }, [visitedSpots, myCollections, progression, navigation]);

  const displayName = user?.name || 'Explorer';
  const handle = `@${usernameFromUser(user)} · ${user?.homeCity || '—'}`;
  const isEditor =
    isSuperAdmin || user?.role === 'admin' || user?.role === 'superadmin';
  const rolePill = isEditor
    ? 'VERIFIED CONTRIBUTOR'
    : `EXPLORER · NO. ${readerNumberFromUser(user)}`;
  const bio =
    user?.bio?.trim() ||
    'Nothing written yet — tell explorers who you are.';

  const sealBadges =
    badges.length > 0
      ? badges
      : [{ id: 'placeholder', name: 'Welcome Explorer', unlocked: false }];

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={fieldGuide.ember}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.topbar}>
          <MonoMeta size="kicker">YOUR FIELD GUIDE</MonoMeta>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={({ pressed }) => [
              styles.gearBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons
              name="settings-outline"
              size={18}
              color={fieldGuide.cream}
            />
          </Pressable>
        </View>

        <View style={styles.idCard}>
          <View style={styles.idRow}>
            <View style={styles.avatarRing}>
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>
                    {initialFor(displayName)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.idInfo}>
              <Text style={styles.displayName}>{displayName}</Text>
              <MonoMeta size="spot" style={styles.handle}>
                {handle}
              </MonoMeta>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{rolePill}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.bio}>{bio}</Text>
          <EditorialButton
            variant="ghost"
            block
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editBtn}
          >
            Edit profile
          </EditorialButton>
        </View>

        {isSpotOwnerPending && !isSpotOwner ? (
          <View style={styles.ownerBanner}>
            <MonoMeta size="spot">APPLICATION UNDER REVIEW</MonoMeta>
            <Text style={styles.ownerBannerText}>
              We&apos;re reviewing your spot owner application. You&apos;ll hear from us soon.
            </Text>
          </View>
        ) : null}

        {canManageOwnSpots ? (
          <View style={styles.ownerCard}>
            <Text style={styles.ownerTitle}>Your venues</Text>
            <Text style={styles.ownerSub}>
              Manage listings, check review status, and see how explorers engage.
            </Text>
            <EditorialButton
              variant="primary"
              block
              onPress={() => navigation.navigate('MySpots')}
              style={{ marginTop: 12 }}
            >
              My spots
            </EditorialButton>
          </View>
        ) : !isSpotOwner && !isSpotOwnerPending && !isSuperAdmin ? (
          <View style={styles.ownerCard}>
            <Text style={styles.ownerTitle}>List your spot on FENA</Text>
            <Text style={styles.ownerSub}>
              Run a café, gallery, or rooftop? Apply to add your venue to the field guide.
            </Text>
            <EditorialButton
              variant="ghost"
              block
              onPress={() => navigation.navigate('BecomeSpotOwner')}
              style={{ marginTop: 12 }}
            >
              Apply as spot owner
            </EditorialButton>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <StatCell
            number={visitedSpots.length}
            label="VISITED"
            trend={visitedTrend}
          />
          <View style={styles.statDivider} />
          <StatCell
            number={reviewCount}
            label="REVIEWS"
            trend={reviewTrend}
          />
          <View style={styles.statDivider} />
          <StatCell
            number={savedSpots.length}
            label="SAVED"
            trend={savedTrend}
          />
        </View>

        <View style={styles.achSection}>
          <View style={styles.achHeaderRow}>
            <Text style={styles.achTitle}>Achievement seals</Text>
            {!revealSeals && !loadingProgression && unlockedBadges.length > 0 ? (
              <Pressable
                onPress={() => setRevealSeals(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Show ${unlockedBadges.length} seals`}
              >
                <MonoMeta size="spot" style={styles.sealsToggle}>
                  {`SEALS (${unlockedBadges.length})`}
                </MonoMeta>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.xpWrap}>
            <View style={styles.xpHeader}>
              <MonoMeta size="spot">{`Level ${levelValue}`}</MonoMeta>
              <MonoMeta size="spot">{`${xpValue} / ${nextLevelXp} XP`}</MonoMeta>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${xpPercent}%` }]} />
            </View>
          </View>

          {loadingProgression ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sealScroll}
            >
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.sealSkeleton} />
              ))}
            </ScrollView>
          ) : revealSeals ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sealScroll}
              >
                {sealBadges.map((badge) => (
                  <AchievementSeal key={badge.id || badge.name} badge={badge} />
                ))}
              </ScrollView>

              {hasOnlyEntryBadge ? (
                loadingBadgeProgress || !badgeProgress || badgeProgress?.error ? (
                  <MonoMeta size="spot" style={styles.nextBadgeHint}>
                    Unlock your next seal by exploring…
                  </MonoMeta>
                ) : badgeProgress.next_badge ? (
                  <View style={styles.badgeProgressWrap}>
                    <MonoMeta size="spot">
                      {`Next: ${badgeProgress.next_badge.name} (${badgeProgress.current_value}/${badgeProgress.required_value})`}
                    </MonoMeta>
                    <View style={styles.progressTrack}>
                      <Animated.View
                        style={[
                          styles.progressFill,
                          {
                            width: progressAnim.interpolate({
                              inputRange: [0, 100],
                              outputRange: ['0%', '100%'],
                            }),
                          },
                        ]}
                      />
                    </View>
                  </View>
                ) : null
              ) : null}
            </>
          ) : null}
        </View>

        <View style={styles.segWrap}>
          <Segmented
            items={['Activity', 'Reviews', 'Saved']}
            value={tab}
            onChange={setTab}
          />
        </View>

        {tab === 0 ? (
          <View style={styles.tabPanel}>
            {activityItems.length === 0 ? (
              <ProfileInlineEmpty title="Your trail starts empty." />
            ) : (
              activityItems.map((item) => (
                <ActivityRow
                  key={item.id}
                  icon={item.icon}
                  iconBg={item.iconBg}
                  title={item.title}
                  meta={item.meta}
                  preview={item.preview}
                  onPress={item.onPress}
                />
              ))
            )}
          </View>
        ) : null}

        {tab === 1 ? (
          <View style={styles.tabPanel}>
            {reviewsError || myReviews.length === 0 ? (
              <EmptyState
                title="No reviews stamped yet."
                italic="yet."
                body="When you leave a note on a spot, it shows up here for fellow explorers."
                cta={{
                  label: 'Explore the field',
                  onPress: () =>
                    navigation.navigate('MainTabs', { screen: 'Explore' }),
                }}
                style={styles.tabEmpty}
              />
            ) : (
              myReviews.map((review) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  onPress={
                    review.spotId
                      ? () =>
                          navigation.navigate('SpotDetail', {
                            spotId: review.spotId,
                          })
                      : undefined
                  }
                  style={styles.reviewRow}
                />
              ))
            )}
          </View>
        ) : null}

        {tab === 2 ? (
          <View style={styles.tabPanel}>
            {savedSpots.length === 0 ? (
              <ProfileInlineEmpty title="Nothing in your pocket yet." />
            ) : (
              <>
                {savedSpots.slice(0, 10).map((spot) => (
                  <SavedSpotRow
                    key={spot.id}
                    spot={spot}
                    onPress={() =>
                      navigation.navigate('SpotDetail', { spotId: spot.id })
                    }
                  />
                ))}
                <Pressable
                  onPress={() =>
                    navigation.navigate('MainTabs', { screen: 'Collections' })
                  }
                  style={styles.seeAll}
                >
                  <MonoMeta size="eyebrow" color={fieldGuide.ember}>
                    See all →
                  </MonoMeta>
                </Pressable>
              </>
            )}
          </View>
        ) : null}
      </ScrollView>

      <XPBadgeCelebration
        visible={showBadgeCelebration}
        onDismiss={() => setShowBadgeCelebration(false)}
        type="badge"
        badgeName={progression?.newestBadge?.name}
        badgeIcon={progression?.newestBadge?.icon}
        message={progression?.newestBadge?.description}
        durationMs={2500}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  scroll: {
    paddingBottom: 40,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  gearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idCard: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  idRow: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
  },
  avatarRing: {
    padding: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: fieldGuide.inkLine2,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: fieldGuide.emberSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 32,
    color: fieldGuide.ink,
  },
  idInfo: {
    flex: 1,
    minWidth: 0,
  },
  displayName: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 22,
    color: fieldGuide.cream,
    letterSpacing: -0.01,
  },
  handle: {
    marginTop: 4,
    color: fieldGuide.creamMute,
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: 'rgba(232,116,58,0.15)',
  },
  rolePillText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    color: fieldGuide.ember,
    textTransform: 'uppercase',
  },
  bio: {
    marginTop: 14,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: fieldGuide.creamSoft,
  },
  editBtn: {
    marginTop: 14,
  },
  ownerBanner: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: fieldGuide.radius.md,
    borderWidth: 1,
    borderColor: fieldGuide.emberSoft,
    backgroundColor: 'rgba(232,180,58,0.08)',
  },
  ownerBannerText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: fieldGuide.creamSoft,
  },
  ownerCard: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: fieldGuide.radius.md,
    borderWidth: 1,
    borderColor: fieldGuide.inkLine,
    backgroundColor: fieldGuide.inkElev,
  },
  ownerTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
  },
  ownerSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: fieldGuide.creamMute,
  },
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  statCell: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'flex-start',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: fieldGuide.inkLine,
  },
  statNumber: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 32,
    lineHeight: 34,
    color: fieldGuide.cream,
  },
  statLabel: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    textTransform: 'uppercase',
    color: fieldGuide.creamMute,
  },
  statTrend: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    color: fieldGuide.moss,
    letterSpacing: fieldGuide.tracking.wide(9),
  },
  achSection: {
    padding: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  achHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  achTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
  },
  sealsToggle: {
    color: fieldGuide.ember,
  },
  xpWrap: {
    marginBottom: 14,
    gap: 8,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sealScroll: {
    gap: 12,
    paddingRight: 22,
  },
  sealSkeleton: {
    width: 92,
    height: 56,
    borderRadius: 28,
    backgroundColor: fieldGuide.inkLine,
    opacity: 0.5,
  },
  nextBadgeHint: {
    marginTop: 14,
    color: fieldGuide.creamMute,
  },
  badgeProgressWrap: {
    marginTop: 14,
    gap: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: fieldGuide.inkLine,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: fieldGuide.ember,
  },
  segWrap: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 0,
  },
  tabPanel: {
    paddingHorizontal: 22,
    paddingVertical: 22,
    gap: 4,
  },
  inlineEmpty: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  inlineEmptyTitle: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 15,
    color: fieldGuide.creamSoft,
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 14.5,
    color: fieldGuide.cream,
    lineHeight: 20,
  },
  activityPreview: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    color: fieldGuide.creamSoft,
    lineHeight: 18,
  },
  reviewRow: {
    marginBottom: 12,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  savedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: fieldGuide.ember,
  },
  savedBody: {
    flex: 1,
    gap: 2,
  },
  savedTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 15,
    color: fieldGuide.cream,
  },
  seeAll: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  tabEmpty: {
    paddingVertical: 8,
  },
});
