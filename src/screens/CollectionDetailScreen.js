/**
 * CollectionDetailScreen — Phase 4 / design 11 (Field Guide rewrite).
 *
 * Layout (no SafeAreaView wrap — the hero is full-bleed):
 *   - col-hero          full-width 320 mosaic + bottom-half ink gradient
 *   - nav-top (abs)     glass back / share / kebab
 *   - col-meta          eyebrow + title + description + info row
 *   - col-actions       cream "Open as route" + ghost share + ghost edit
 *   - list-head         hairline + "{n} spots in this pocket" + Reorder
 *   - item-list         rows with drag handles (reorder mode), thumbs,
 *                       titles, mono meta, optional per-spot notes, and
 *                       a swipe-style remove control.
 *
 * Data:
 *   - useQuery wraps getCollectionById(id).
 *   - state `items` holds the orderable spot list. Reorder uses up/down
 *     arrow buttons (the dragger lib is not installed; arrow controls
 *     are an acceptable fallback per the brief).
 *   - removeSpotFromCollection on tap-to-remove (with confirm).
 *   - Done reordering → updateCollection(id, { spotOrder }). If the
 *     backend rejects spotOrder, we Toast and persist the order in
 *     AsyncStorage under `fena.collectionOrder.${id}`.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CollectionMenuSheet,
  DisplayTitle,
  DuotoneVibe,
  EditorialButton,
  EmptyState,
  IconSquare,
  IndexStamp,
  MonoMeta,
  MosaicCover,
  Rule,
  ShareDispatchSheet,
} from '../components/fieldguide';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';
import {
  deleteCollection,
  getCollectionById,
  removeSpotFromCollection,
  shareCollection,
  updateCollection,
} from '../services/collections.service';
import {
  indexForSpot,
  prettyCategory,
  vibeForCategory,
  zeroPad,
} from '../utils/spotHelpers';

const HERO_HEIGHT = 320;

/* ─────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function unwrapItem(row, fallbackIndex) {
  // The /collections/:id endpoint may return either `[ { spot: {...}, note } ]`
  // (join shape) or `[ { id, title, category, ... } ]` (inline shape).
  const spot = row?.spot && row?.spot?.id ? row.spot : row;
  return {
    ...spot,
    _join: row?.spot ? row : null,
    _note: row?.note || row?.spot?.note || null,
    _orderHint: row?.order ?? row?.position ?? fallbackIndex,
  };
}

function deriveItems(collection) {
  const raw = Array.isArray(collection?.spots) ? collection.spots : [];
  return raw.map((row, i) => unwrapItem(row, i));
}

function uniqueCities(items) {
  const seen = new Set();
  const out = [];
  for (const s of items) {
    const c = (s?.city || s?.district || '').trim();
    if (!c) continue;
    const k = c.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  }
  return out;
}

function privacyLabel(collection) {
  if (collection?.isPublic) return 'PUBLIC';
  const shared =
    (Array.isArray(collection?.sharedWith) && collection.sharedWith.length) ||
    Number(collection?.sharedCount) ||
    0;
  if (shared > 0) return `SHARED · ${shared}`;
  return 'PRIVATE';
}

function splitTitleForItalic(title) {
  if (!title || typeof title !== 'string') return { lead: title, tail: '' };
  const idx = title.lastIndexOf(',');
  if (idx === -1) return { lead: title, tail: '' };
  return {
    lead: title.slice(0, idx + 1),
    tail: title.slice(idx + 1).trim(),
  };
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

function spotImageFor(item) {
  return (
    pickImageUri(item?.thumbnail) ||
    pickImageUri(item?.image) ||
    pickImageUri(item?.coverImage) ||
    (Array.isArray(item?.images)
      ? item.images.map(pickImageUri).find(Boolean)
      : null)
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  ROW                                                                */
/* ─────────────────────────────────────────────────────────────────── */

function ItemRow({
  item,
  index,
  total,
  reorderMode,
  onPress,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {

  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const vibe = vibeForCategory(item?.category);
  const district = item?.district || item?.city;
  const noLabel = zeroPad(indexForSpot(item) ?? index + 1, 2);
  const note = item?._note;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item?.title || 'Spot'}
        disabled={reorderMode}
        style={({ pressed }) => [
          styles.rowMain,
          { opacity: pressed && !reorderMode ? 0.92 : 1 },
        ]}
      >
        {reorderMode ? (
          <View style={styles.dragCol}>
            <Pressable
              onPress={onMoveUp}
              disabled={index === 0}
              hitSlop={6}
              style={({ pressed }) => [
                styles.dragArrow,
                {
                  opacity: index === 0 ? 0.35 : pressed ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Move up"
            >
              <Ionicons name="chevron-up" size={14} color={fieldGuide.cream} />
            </Pressable>
            <Pressable
              onPress={onMoveDown}
              disabled={index === total - 1}
              hitSlop={6}
              style={({ pressed }) => [
                styles.dragArrow,
                {
                  opacity: index === total - 1 ? 0.35 : pressed ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Move down"
            >
              <Ionicons name="chevron-down" size={14} color={fieldGuide.cream} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.thumb}>
          <DuotoneVibe
            vibe={vibe}
            image={spotImageFor(item) ? { uri: spotImageFor(item) } : undefined}
          />
          <IndexStamp position="tl" style={styles.thumbStamp}>
            {noLabel}
          </IndexStamp>
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item?.title || 'Untitled'}
          </Text>
          <MonoMeta size="spot" style={styles.rowMeta}>
            {[prettyCategory(item?.category), district].filter(Boolean).join('  ·  ')}
          </MonoMeta>
          {note ? (
            <Text style={styles.rowNote} numberOfLines={2}>
              {note.startsWith('"') ? note : `"${note}"`}
            </Text>
          ) : null}
        </View>

        {reorderMode ? (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel="Remove from collection"
            hitSlop={8}
            style={({ pressed }) => [
              styles.removeBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.removeLabel}>REMOVE</Text>
          </Pressable>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={fieldGuide.creamFaint}
            style={styles.chev}
          />
        )}
      </Pressable>
      <View style={styles.rowDivider} />
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SCREEN                                                             */
/* ─────────────────────────────────────────────────────────────────── */

export const CollectionDetailScreen = ({ navigation, route }) => {

  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const id = route?.params?.id ?? route?.params?.collectionId;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['collection', id],
    queryFn: () => getCollectionById(id),
    enabled: !!id,
  });

  const collection = query.data && !query.data.error ? query.data : null;

  /* Local mutable list (so reorder + remove don't fight the server). */
  const [items, setItems] = useState([]);
  const baselineOrderRef = useRef([]);
  const [reorderMode, setReorderMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!collection) return;
      let next = deriveItems(collection);
      // Apply any locally-saved order overlay.
      try {
        const stored = await AsyncStorage.getItem(`fena.collectionOrder.${id}`);
        if (stored && !cancelled) {
          const order = JSON.parse(stored);
          if (Array.isArray(order)) {
            const byId = new Map(next.map((s) => [s?.id, s]));
            const reordered = order.map((sid) => byId.get(sid)).filter(Boolean);
            const tail = next.filter((s) => !order.includes(s?.id));
            next = [...reordered, ...tail];
          }
        }
      } catch (err) {
        logger.error('CollectionDetail.readLocalOrder', err);
      }
      if (!cancelled) {
        setItems(next);
        baselineOrderRef.current = next.map((s) => s?.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collection, id]);

  /* ── derived header values ───────────────────────────────────────── */
  const spotCount = items.length;
  const cities = useMemo(() => uniqueCities(items), [items]);
  const heroVibes = useMemo(
    () => items.slice(0, 5).map((s) => vibeForCategory(s?.category)),
    [items],
  );
  const heroImages = useMemo(
    () => items.slice(0, 5).map((s) => spotImageFor(s)).filter(Boolean),
    [items],
  );
  const extra = Math.max(0, spotCount - 4);
  const priv = privacyLabel(collection);
  const { lead, tail } = splitTitleForItalic(collection?.title);
  const isOwner =
    !!user?.id &&
    (collection?.userId === user.id || collection?.user?.id === user.id);

  /* ── reorder actions ─────────────────────────────────────────────── */
  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice();
    const [pulled] = next.splice(from, 1);
    next.splice(to, 0, pulled);
    setItems(next);
  };

  const orderChanged = useMemo(() => {
    const current = items.map((s) => s?.id);
    const baseline = baselineOrderRef.current;
    if (current.length !== baseline.length) return true;
    for (let i = 0; i < current.length; i++) {
      if (current[i] !== baseline[i]) return true;
    }
    return false;
  }, [items]);

  const finishReorder = async () => {
    if (!orderChanged) {
      setReorderMode(false);
      return;
    }
    const spotOrder = items.map((s) => s?.id).filter(Boolean);
    const result = await updateCollection(id, { spotOrder });
    if (result?.error) {
      // Backend may not understand spotOrder yet — persist locally.
      try {
        await AsyncStorage.setItem(
          `fena.collectionOrder.${id}`,
          JSON.stringify(spotOrder),
        );
        toast.show('Order saved locally.', { variant: 'info' });
      } catch (err) {
        logger.error('CollectionDetail.persistLocalOrder', err);
        toast.show('Could not save the new order.', { variant: 'error' });
      }
    } else {
      toast.show('Order saved.', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['collection', id] });
    }
    baselineOrderRef.current = spotOrder;
    setReorderMode(false);
  };

  /* ── remove a spot ───────────────────────────────────────────────── */
  const handleRemove = (spot) => {
    if (!isOwner) return;
    if (!spot?.id) return;
    Alert.alert(
      'Remove from collection?',
      `"${spot.title || 'This spot'}" will stay in your library — just not in this pocket.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const snapshot = items;
            setItems(items.filter((s) => s.id !== spot.id));
            const result = await removeSpotFromCollection(id, spot.id);
            if (result?.error) {
              logger.error('CollectionDetail.remove', result.error);
              setItems(snapshot);
              toast.show('Could not remove that spot.', { variant: 'error' });
            } else {
              queryClient.invalidateQueries({ queryKey: ['collection', id] });
              queryClient.invalidateQueries({ queryKey: ['user-collections'] });
            }
          },
        },
      ],
    );
  };

  /* ── header actions ──────────────────────────────────────────────── */
  const openRoute = async () => {
    const stops = items
      .map((s) => {
        const lat = s?.latitude ?? s?.lat ?? s?.location?.latitude ?? s?.location?.lat;
        const lng = s?.longitude ?? s?.lng ?? s?.location?.longitude ?? s?.location?.lng;
        return lat != null && lng != null ? `${lat},${lng}` : null;
      })
      .filter(Boolean);
    if (stops.length < 2) {
      toast.show('Need at least two spots with coordinates.', { variant: 'info' });
      return;
    }
    const origin = stops[0];
    const destination = stops[stops.length - 1];
    const waypoints = stops.slice(1, -1).join('|');
    const params = new URLSearchParams({
      api: '1',
      origin,
      destination,
      ...(waypoints ? { waypoints } : {}),
      travelmode: 'walking',
    });
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?saddr=${origin}&daddr=${destination}`
        : `https://www.google.com/maps/dir/?${params.toString()}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        toast.show('No maps app available.', { variant: 'error' });
      }
    } catch (err) {
      logger.error('CollectionDetail.openRoute', err);
      toast.show('Could not open maps.', { variant: 'error' });
    }
  };

  const handleShare = () => {
    if (!collection) return;
    if (!collection.isPublic) {
      toast.show('Private pockets cannot be shared.', { variant: 'info' });
      return;
    }
    setShareOpen(true);
  };

  const handleShareRecorded = () => {
    if (id) shareCollection(id).catch(() => {});
  };

  const handleEdit = () => {
    if (!isOwner) return;
    navigation.navigate('CreateCollection', { id, mode: 'edit' });
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    const result = await deleteCollection(id);
    if (result?.error) {
      toast.show('Could not delete the collection.', { variant: 'error' });
      logger.error('CollectionDetail.delete', result.error);
      return;
    }
    toast.show('Collection deleted.', { variant: 'success' });
    queryClient.invalidateQueries({ queryKey: ['user-collections'] });
    navigation.goBack();
  };

  /* ── loading + error ─────────────────────────────────────────────── */
  if (!id) {
    return (
      <View style={styles.fillCenter}>
        <EmptyState title="No collection selected." body="Open one from the Saved tab." />
      </View>
    );
  }

  if (query.isLoading && !collection) {
    return (
      <View style={styles.fillCenter}>
        <ActivityIndicator color={fieldGuide.ember} />
      </View>
    );
  }

  if (query.isError || !collection) {
    return (
      <View style={[styles.fillCenter, { backgroundColor: fieldGuide.ink }]}>
        <EmptyState
          title="Couldn’t load this collection."
          italic="this collection."
          body="Pull-to-refresh, or come back later."
          cta={{ label: 'Back', onPress: () => navigation.goBack() }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* HERO */}
        <View style={styles.hero}>
          <MosaicCover
            vibes={heroVibes}
            images={heroImages}
            extraCount={extra}
            aspectRatio={undefined}
            style={styles.heroMosaic}
          />
          <LinearGradient
            colors={['transparent', fieldGuide.ink]}
            locations={[0.4, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        {/* META */}
        <View style={[styles.meta, { marginTop: -40 }]}>
          <MonoMeta size="eyebrow" style={styles.eyebrow}>
            {`${spotCount} SPOTS · COLLECTION`}
          </MonoMeta>
          <DisplayTitle size="xl" weight="500" italic={tail || undefined}>
            {tail ? `${lead} ${tail}` : collection.title || 'Untitled'}
          </DisplayTitle>
          {collection.description ? (
            <Text style={styles.desc}>{collection.description}</Text>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoStrong}>{`${spotCount} SPOTS`}</Text>
            <Text style={styles.infoDim}>·</Text>
            <Text style={styles.infoDim}>{`${cities.length} CITIES`}</Text>
            <Text style={styles.infoDim}>·</Text>
            <Pressable
              onPress={() => toast.show('Privacy editor coming soon.', { variant: 'info' })}
              hitSlop={6}
            >
              <Text style={styles.infoEmber}>{priv}</Text>
            </Pressable>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <EditorialButton
            variant="cream"
            size="sm"
            leading={<Ionicons name="navigate-outline" size={14} color={fieldGuide.ink} />}
            onPress={openRoute}
            style={styles.actionFlex}
          >
            Open as route
          </EditorialButton>
          <EditorialButton
            variant="ghost"
            size="sm"
            leading={<Ionicons name="share-outline" size={14} color={fieldGuide.cream} />}
            onPress={handleShare}
          >
            Share
          </EditorialButton>
          {isOwner ? (
            <Pressable
              onPress={handleEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit collection"
              style={({ pressed }) => [
                styles.ghostIconBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="create-outline" size={16} color={fieldGuide.cream} />
            </Pressable>
          ) : null}
        </View>

        {/* LIST HEAD */}
        <View style={styles.listHead}>
          <Rule style={styles.listHeadRule} />
          <View style={styles.listHeadRow}>
            <Text style={styles.listHeadTitle}>
              {`${spotCount} ${spotCount === 1 ? 'spot' : 'spots'} in this pocket`}
            </Text>
            {isOwner ? (
              <Pressable
                onPress={reorderMode ? finishReorder : () => setReorderMode(true)}
                hitSlop={8}
                disabled={!spotCount}
              >
                <Text
                  style={[
                    styles.reorderLink,
                    !spotCount && { opacity: 0.35 },
                  ]}
                >
                  {reorderMode ? 'Done ↗' : 'Reorder ↗'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ITEMS */}
        {items.length === 0 ? (
          <View style={styles.emptyList}>
            <EmptyState
              title="This pocket is empty."
              italic="empty."
              body="Save a spot, then tap the bookmark dropdown to drop it into this collection."
            />
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, i) => (
              <ItemRow
                key={item?.id ?? i}
                item={item}
                index={i}
                total={items.length}
                reorderMode={reorderMode && isOwner}
                onPress={() =>
                  navigation.push('SpotDetail', { spotId: item?.id })
                }
                onRemove={() => handleRemove(item)}
                onMoveUp={() => move(i, i - 1)}
                onMoveDown={() => move(i, i + 1)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FLOATING NAV-TOP */}
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
          <IconSquare onPress={handleShare} accessibilityLabel="Share" size={38}>
            <Ionicons name="share-outline" size={16} color={fieldGuide.cream} />
          </IconSquare>
          <View style={{ width: 8 }} />
          {isOwner ? (
            <IconSquare
              onPress={() => setMenuOpen(true)}
              accessibilityLabel="More"
              size={38}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={16}
                color={fieldGuide.cream}
              />
            </IconSquare>
          ) : null}
        </View>
      </View>

      <CollectionMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        collection={collection}
        isOwner={isOwner}
        onEdit={handleEdit}
        onShare={handleShare}
        onDelete={() => handleDelete()}
      />

      <ShareDispatchSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        variant="collection"
        collection={collection}
        userName={user?.name || user?.displayName || ''}
        onShared={handleShareRecorded}
      />
    </View>
  );
};

export default CollectionDetailScreen;

function createStyles(fieldGuide) {
  return StyleSheet.create({
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
    paddingBottom: 120,
  },
  hero: {
    width: '100%',
    height: HERO_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  heroMosaic: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    aspectRatio: undefined,
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
  },
  meta: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 8,
    position: 'relative',
    zIndex: 2,
  },
  eyebrow: {
    marginBottom: 8,
  },
  desc: {
    marginTop: 12,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: fieldGuide.creamSoft,
    maxWidth: 460,
  },
  infoRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoStrong: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.widest(9.5),
    color: fieldGuide.cream,
    textTransform: 'uppercase',
    marginRight: 14,
  },
  infoDim: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.widest(9.5),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
    marginRight: 14,
  },
  infoEmber: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.widest(9.5),
    color: fieldGuide.ember,
    textTransform: 'uppercase',
  },
  actions: {
    marginTop: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionFlex: {
    flex: 1,
  },
  ghostIconBtn: {
    width: 44,
    height: 44,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHead: {
    marginTop: 22,
  },
  listHeadRule: {
    marginHorizontal: 0,
  },
  listHeadRow: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeadTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
    includeFontPadding: false,
    letterSpacing: -0.005 * 18,
  },
  reorderLink: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.ember,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 22,
    paddingTop: 4,
  },
  emptyList: {
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  row: {},
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: fieldGuide.inkLine,
  },
  dragCol: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragArrow: {
    padding: 4,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: fieldGuide.radius.md,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
  },
  thumbStamp: {
    top: 4,
    left: 6,
    fontSize: 7.5,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 15.5,
    lineHeight: 19,
    color: fieldGuide.cream,
    letterSpacing: -0.005 * 15.5,
    includeFontPadding: false,
  },
  rowMeta: {
    marginTop: 3,
  },
  rowNote: {
    marginTop: 6,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: fieldGuide.creamMute,
  },
  chev: {
    marginLeft: 2,
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: fieldGuide.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.rose,
  },
  removeLabel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.widest(9),
    color: fieldGuide.rose,
    textTransform: 'uppercase',
  },
});
}
