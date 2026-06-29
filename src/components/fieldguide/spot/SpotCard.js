/**
 * SpotCard — the workhorse list item.
 *
 * Layout matches:
 *   - pick    (220 wide, 3/4 photo, title 18, mono meta) — .pick-card in
 *             screens/07-home.html L139-152
 *   - near    (170 wide, 1/1 photo, title 15, distance below) — .near-card
 *             same file L234-246
 *   - feature (full width, 4/5 photo, title 22, blurb body) — generic
 *             editorial layout used in Explore and Collections
 *
 * Props:
 *   spot: {
 *     id, title, vibe, indexNumber, district, category, distance,
 *     rating, ratingCount, savedCount, isWeeklyChampion,
 *     savedByMe, image, blurb
 *   }
 *   variant?: 'pick' | 'near' | 'feature'    default 'pick'
 *   onPress: () => void
 *   onToggleSave: () => void
 *   style?: ViewStyle
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import fieldGuide from '../../../theme/fieldGuide';
import SpotPhoto from './SpotPhoto';
import MonoMeta from '../primitives/MonoMeta';

function ratingLabelFor(rating) {
  const r = Number(rating) || 0;
  if (r <= 0) return null;
  return `★ ${r.toFixed(1)}`;
}

function savesLabelFor(savedCount) {
  const n = Number(savedCount) || 0;
  if (n <= 0) return null;
  const compact = n >= 1000 ? `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k` : String(n);
  return `${compact} SAVED`;
}

const VARIANT = {
  pick:    { width: 220,    aspect: '3/4',   titleSize: 18, fullWidth: false },
  near:    { width: 170,    aspect: '1/1',   titleSize: 15, fullWidth: false },
  feature: { width: '100%', aspect: '4/5',   titleSize: 22, fullWidth: true  },
  // 'similar' — 150-wide card used on Spot Detail's "If you liked this"
  // h-scroll (screens/13-spot-detail.html L314-329). Smaller title
  // (Syne 14), same 4/5 photo as the feature card.
  similar: { width: 150,    aspect: '4/5',   titleSize: 14, fullWidth: false },
};

function MetaRow({ parts }) {
  return (
    <MonoMeta size="spot" style={{ marginTop: 4 }}>
      {parts.filter(Boolean).join('  ·  ')}
    </MonoMeta>
  );
}

export default function SpotCard({
  spot,
  variant = 'pick',
  onPress,
  onToggleSave,
  style,
}) {
  const v = VARIANT[variant] || VARIANT.pick;
  const {
    title,
    vibe = 'cafe',
    indexNumber,
    district,
    category,
    distance,
    rating,
    savedCount,
    isWeeklyChampion,
    savedByMe,
    image,
    blurb,
  } = spot || {};

  const ratingLabel = ratingLabelFor(rating);
  // Saves are extra social proof — only on the roomier pick/feature cards.
  const savesLabel = variant === 'near' ? null : savesLabelFor(savedCount);

  // Pick stamps usually read "NO. 042". Near/distance stamps already
  // carry a unit ("0.4 MI", "4 MIN") or a free-form label with a space
  // — those should print verbatim instead of getting a "NO." prefix.
  const rawIndex = indexNumber != null ? String(indexNumber) : undefined;
  const indexLabel = rawIndex
    ? (rawIndex.startsWith('NO.') || rawIndex.includes(' ') ? rawIndex : `NO. ${rawIndex}`)
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.card,
        { width: v.width, opacity: pressed ? 0.92 : 1 },
        style,
      ]}
    >
      <SpotPhoto
        vibe={vibe}
        image={image}
        aspect={v.aspect}
        index={indexLabel}
        saved={!!savedByMe}
        onToggleSave={onToggleSave}
      >
        {isWeeklyChampion ? (
          <View style={styles.championRibbon}>
            <Text style={styles.championText}>★ CHAMPION</Text>
          </View>
        ) : null}
      </SpotPhoto>

      <Text
        style={[
          styles.title,
          {
            fontSize: v.titleSize,
            lineHeight: Math.round(v.titleSize * 1.18),
          },
        ]}
        numberOfLines={variant === 'feature' ? 2 : 2}
      >
        {title}
      </Text>

      {variant === 'near' && distance ? (
        <MonoMeta size="spot" style={{ marginTop: 3 }}>
          {[ratingLabel, String(distance).toUpperCase()].filter(Boolean).join('  ·  ')}
        </MonoMeta>
      ) : variant === 'feature' && blurb ? (
        <>
          <MetaRow parts={[ratingLabel, category, district, distance, savesLabel]} />
          <Text style={styles.blurb} numberOfLines={2}>
            {blurb}
          </Text>
        </>
      ) : (
        <MetaRow parts={[ratingLabel, category, district, distance, savesLabel]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
  },
  title: {
    marginTop: 10,
    fontFamily: fieldGuide.fonts.serifMedium,
    color: fieldGuide.cream,
    letterSpacing: -0.005 * 18,
    includeFontPadding: false,
  },
  blurb: {
    marginTop: 6,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: fieldGuide.creamSoft,
  },
  championRibbon: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: fieldGuide.gold,
  },
  championText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 8.5,
    letterSpacing: 1.2,
    color: fieldGuide.ink,
    includeFontPadding: false,
  },
});
