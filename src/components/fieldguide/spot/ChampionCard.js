/**
 * ChampionCard — full-bleed weekly champion hero.
 *
 * CSS ref: .champion-card / .label / .rank / .body and the version in
 * screens/07-home.html L84-136. Notable: aspect-ratio 4/5.4, giant
 * Fraunces 300 rank numeral with text-shadow, bottom gradient body
 * (transparent → ink-deep@55% @ 50% → ink-deep@92% @ 100%).
 *
 * Props:
 *   spot: { title, blurb, vibe, rank, weekNumber, category, district, distance }
 *   onPress: () => void
 *   style?: ViewStyle
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import fieldGuide from '../../../theme/fieldGuide';
import DuotoneVibe from './DuotoneVibe';

const RANK_FS = 92;
const LABEL_FS = 10;
const TITLE_FS = 30;
const BLURB_FS = 13.5;
const META_FS = 10;

export default function ChampionCard({ spot, onPress, style }) {
  const {
    title = 'Champion',
    blurb,
    vibe = 'cafe',
    rank = '01',
    weekNumber,
    category,
    district,
    distance,
  } = spot || {};

  const rankLabel = typeof rank === 'number'
    ? String(rank).padStart(2, '0')
    : String(rank);

  const labelText = `CHAMPION${weekNumber != null ? ` · WEEK ${weekNumber}` : ''}`;
  const metaParts = [category, district, distance].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Champion: ${title}`}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.96 : 1 },
        style,
      ]}
    >
      <DuotoneVibe vibe={vibe} />

      <BlurView tint="dark" intensity={24} style={styles.labelWrap}>
        <View style={styles.labelDot} />
        <Text style={styles.label} numberOfLines={1}>{labelText}</Text>
      </BlurView>

      <Text style={styles.rank} numberOfLines={1}>{rankLabel}</Text>

      <LinearGradient
        colors={['rgba(11,12,17,0)', 'rgba(11,12,17,0.55)', 'rgba(11,12,17,0.92)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.body}
      >
        <Text style={styles.title}>{title}</Text>
        {blurb ? (
          <Text style={styles.blurb} numberOfLines={3}>{blurb}</Text>
        ) : null}
        {metaParts.length ? (
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {metaParts.map((p, i) => (
                <Text
                  key={i}
                  style={
                    p === distance
                      ? { color: fieldGuide.emberSoft, fontFamily: fieldGuide.fonts.monoMed }
                      : undefined
                  }
                >
                  {(i === 0 ? '' : '  ·  ') + String(p).toUpperCase()}
                </Text>
              ))}
            </Text>
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 4 / 5.4,
    borderRadius: fieldGuide.radius.xl,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
    position: 'relative',
  },
  labelWrap: {
    position: 'absolute',
    top: 18,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,239,230,0.18)',
    backgroundColor: 'rgba(20,22,29,0.4)',
    overflow: 'hidden',
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: fieldGuide.ember,
    marginRight: 8,
  },
  label: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: LABEL_FS,
    letterSpacing: fieldGuide.tracking.mono30(LABEL_FS),
    textTransform: 'uppercase',
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  rank: {
    position: 'absolute',
    top: 16,
    right: 22,
    fontFamily: fieldGuide.fonts.serifLight,
    fontSize: RANK_FS,
    lineHeight: RANK_FS,
    letterSpacing: -0.04 * RANK_FS,
    color: fieldGuide.cream,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 30,
    includeFontPadding: false,
  },
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 22,
  },
  title: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: TITLE_FS,
    lineHeight: Math.round(TITLE_FS * 1.05),
    letterSpacing: -0.015 * TITLE_FS,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  blurb: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: BLURB_FS,
    lineHeight: Math.round(BLURB_FS * 1.45),
    color: 'rgba(244,239,230,0.78)',
  },
  metaRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: META_FS,
    letterSpacing: fieldGuide.tracking.widest(META_FS),
    textTransform: 'uppercase',
    color: 'rgba(244,239,230,0.7)',
    includeFontPadding: false,
  },
});
