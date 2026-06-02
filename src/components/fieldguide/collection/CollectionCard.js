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
 *   style?: ViewStyle
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../../../theme/fieldGuide';
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
  canShowMenu = true,
  style,
}) {
  const spotCount = deriveSpotCount(collection);
  const cities = useMemo(() => deriveCities(collection), [collection]);
  const vibes = useMemo(() => deriveVibes(collection), [collection]);
  const images = useMemo(() => deriveImages(collection), [collection]);
  const extra = Math.max(0, spotCount - 4);
  const cityLabel = citySummary(cities, spotCount);
  const priv = privacyTag(collection);

  const metaParts = [
    `${spotCount} SPOT${spotCount === 1 ? '' : 'S'}`,
    cityLabel,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={collection?.title || 'Collection'}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.94 : 1 },
        style,
      ]}
    >
      <MosaicCover vibes={vibes} images={images} extraCount={extra} />

      <View style={styles.body}>
        <View style={styles.bodyLeft}>
          <Text style={styles.title} numberOfLines={1}>
            {collection?.title || 'Untitled collection'}
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
    </Pressable>
  );
}

const META_FS = 9.5;

const styles = StyleSheet.create({
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
});
