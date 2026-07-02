/**
 * CollectionCard — single row in the Collections list.
 *
 * CSS ref: .col-card (screens/10-collections.html L41-96). A mosaic
 * cover sits on top of an inkElev body that hosts the title, the
 * mono caps meta string (spots · cities · privacy), and a 30 px
 * outline kebab button.
 *
 * Props:
 *   collection: {
 *     id, title, description,
 *     isPublic, sharedWith,
 *     spots: [{ id, category, address, city }],   // optional but used
 *     spotCount: number,                          // optional
 *     cities: string[]                            // optional
 *   }
 *   onPress?: () => void
 *   onLongPress?: () => void
 *   onMenuPress?: () => void          tap the kebab specifically
 *   onToggleLike?: (nextLiked: boolean) => void   tap the heart
 *   onSharePress?: () => void         tap the share glyph (public only)
 *   style?: ViewStyle
 */

import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import MonoMeta from '../primitives/MonoMeta';
import MosaicCover from './MosaicCover';
import { vibeForCategory } from '../../../utils/spotHelpers';

function deriveSpotCount(collection) {
  if (typeof collection?.spotCount === 'number') return collection.spotCount;
  if (Array.isArray(collection?.spots)) return collection.spots.length;
  return 0;
}

function deriveCities(collection) {
  if (Array.isArray(collection?.cities) && collection.cities.length) {
    return collection.cities;
  }
  const fromSpots = (collection?.spots || [])
    .map((s) => s?.city || s?.spot?.city || s?.address?.city)
    .filter(Boolean);
  // dedupe while preserving order
  const seen = new Set();
  const out = [];
  for (const c of fromSpots) {
    const k = String(c).trim();
    if (!seen.has(k.toLowerCase())) {
      seen.add(k.toLowerCase());
      out.push(k);
    }
  }
  return out;
}

function deriveVibes(collection) {
  // Walk the embedded spots (the API sometimes nests them as
  // { spot: {...} } via a join table, sometimes inlines them).
  const list = (collection?.spots || [])
    .slice(0, 4)
    .map((s) => {
      const cat = s?.category || s?.spot?.category;
      return vibeForCategory(cat);
    })
    .filter(Boolean);
  return list;
}

function deriveImages(collection) {
  return (collection?.spots || [])
    .slice(0, 4)
    .map((s) => s?.thumbnail || s?.spot?.thumbnail || s?.images?.[0] || s?.spot?.images?.[0])
    .filter(Boolean);
}

function citySummary(cities, spotCount) {
  if (!spotCount) return 'EMPTY';
  if (!cities.length) return null;
  if (cities.length === 1) return cities[0].toUpperCase();
  if (cities.length <= 3) return cities.map((c) => c.toUpperCase()).join(', ');
  return `${cities.length} CITIES`;
}

function resolveCreator(collection) {
  const c = collection?.creator || collection?.user;
  if (!c) return null;
  const topBadge = c.topBadge || null;
  return {
    id: c.id,
    name: c.name || 'Unknown curator',
    profileImage: c.profileImage ?? null,
    topBadge,
  };
}

function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 >= 100 ? 1 : 0)}k`;
  return String(v);
}

function privacyTag(collection) {
  if (collection?.isPublic) return { label: 'PUBLIC', accent: true };
  const sharedCount =
    (Array.isArray(collection?.sharedWith) && collection.sharedWith.length) ||
    Number(collection?.sharedCount) ||
    0;
  if (sharedCount > 0) return { label: `SHARED · ${sharedCount}`, accent: false };
  return { label: 'PRIVATE', accent: true };
}

export default function CollectionCard({
  collection,
  onPress,
  onLongPress,
  onMenuPress,
  onToggleLike,
  onSharePress,
  canShowMenu = true,
  style,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const spotCount = deriveSpotCount(collection);
  const cities = useMemo(() => deriveCities(collection), [collection]);
  const vibes = useMemo(() => deriveVibes(collection), [collection]);
  const images = useMemo(() => deriveImages(collection), [collection]);
  const extra = Math.max(0, spotCount - 4);
  const cityLabel = citySummary(cities, spotCount);
  const priv = privacyTag(collection);
  const creator = useMemo(() => resolveCreator(collection), [collection]);

  const liked = !!collection?.isLiked;
  const likeCount = Number(collection?.likeCount) || 0;
  const shareCount = Number(collection?.sharedCount) || 0;
  const canShare = !!collection?.isPublic && typeof onSharePress === 'function';
  const canLike = typeof onToggleLike === 'function';

  const metaParts = [
    `${spotCount} SPOT${spotCount === 1 ? '' : 'S'}`,
    cityLabel,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={collection?.title || 'Pocket'}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.94 : 1 },
        style,
      ]}
    >
      <MosaicCover vibes={vibes} images={images} extraCount={extra} />

      <View style={styles.body}>
        <View style={styles.bodyLeft}>
          {creator ? (
            <View style={styles.creatorRow}>
              {creator.profileImage ? (
                <Image source={{ uri: creator.profileImage }} style={styles.creatorAvatar} />
              ) : (
                <View style={[styles.creatorAvatar, styles.creatorAvatarFallback]}>
                  <Text style={styles.creatorInitial}>
                    {(creator.name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.creatorName} numberOfLines={1}>
                {creator.name}
              </Text>
              {creator.topBadge ? (
                <>
                  <Text style={styles.creatorDot}>·</Text>
                  <Text style={styles.creatorBadge}>
                    {creator.topBadge.icon ? `${creator.topBadge.icon} ` : ''}
                    {creator.topBadge.name}
                  </Text>
                </>
              ) : null}
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {collection?.title || 'Untitled pocket'}
          </Text>
          <View style={styles.metaRow}>
            <MonoMeta size="spot">{metaParts.join('  ·  ')}</MonoMeta>
            <View style={styles.metaDot} />
            <Text
              style={[
                styles.privLabel,
                { color: priv.accent ? fieldGuide.ember : fieldGuide.creamMute },
              ]}
              numberOfLines={1}
            >
              {priv.label}
            </Text>
          </View>
        </View>

        {canShowMenu ? (
          <Pressable
            onPress={onMenuPress || onLongPress}
            accessibilityRole="button"
            accessibilityLabel="Collection options"
            hitSlop={10}
            style={({ pressed }) => [
              styles.kebab,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={14}
              color={fieldGuide.creamMute}
            />
          </Pressable>
        ) : null}
      </View>

      {(canLike || canShare || likeCount > 0 || shareCount > 0) ? (
        <View style={styles.statRow}>
          <Pressable
            onPress={canLike ? () => onToggleLike(!liked) : undefined}
            disabled={!canLike}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Unlike collection' : 'Like collection'}
            hitSlop={8}
            style={({ pressed }) => [styles.stat, { opacity: pressed && canLike ? 0.6 : 1 }]}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={15}
              color={liked ? fieldGuide.ember : fieldGuide.creamMute}
            />
            <Text style={[styles.statLabel, liked && styles.statLabelActive]}>
              {formatCount(likeCount)}
            </Text>
          </Pressable>

          {canShare ? (
            <Pressable
              onPress={onSharePress}
              accessibilityRole="button"
              accessibilityLabel="Share collection"
              hitSlop={8}
              style={({ pressed }) => [styles.stat, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="arrow-redo-outline" size={15} color={fieldGuide.creamMute} />
              <Text style={styles.statLabel}>{formatCount(shareCount)}</Text>
            </Pressable>
          ) : shareCount > 0 ? (
            <View style={styles.stat}>
              <Ionicons name="arrow-redo-outline" size={15} color={fieldGuide.creamMute} />
              <Text style={styles.statLabel}>{formatCount(shareCount)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const META_FS = 9.5;

function createStyles(fieldGuide) {
  return StyleSheet.create({
  card: {
    backgroundColor: fieldGuide.inkElev,
    borderRadius: fieldGuide.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  bodyLeft: {
    flex: 1,
    minWidth: 0,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  creatorAvatarFallback: {
    backgroundColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInitial: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 11,
    color: fieldGuide.creamMute,
  },
  creatorName: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 10,
    color: fieldGuide.creamSoft,
    maxWidth: 120,
  },
  creatorDot: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    color: fieldGuide.creamFaint,
  },
  creatorBadge: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  title: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 19,
    lineHeight: 22,
    letterSpacing: -0.01 * 19,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
    backgroundColor: fieldGuide.creamFaint,
  },
  privLabel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: META_FS,
    letterSpacing: fieldGuide.tracking.widest(META_FS),
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  kebab: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: fieldGuide.inkLine,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 11,
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  statLabelActive: {
    color: fieldGuide.ember,
  },
});
}
