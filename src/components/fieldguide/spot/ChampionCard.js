/**
 * ChampionCard — full-bleed weekly champion hero.
 *
 * CSS ref: .champion-card / .label / .rank / .body and the version in
 * screens/07-home.html L84-136. Notable: aspect-ratio 4/5.4, giant
 * Syne 800 rank numeral with text-shadow, bottom gradient body
 * (transparent → ink-deep@55% @ 50% → ink-deep@92% @ 100%).
 *
 * Props:
 *   spot: { title, blurb, vibe, rank, weekNumber, category, district, distance }
 *   onPress: () => void
 *   style?: ViewStyle
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import fieldGuide from '../../../theme/fieldGuide';
import DuotoneVibe from './DuotoneVibe';

const RANK_FS = 92;
const LABEL_FS = 10;
const TITLE_FS = 30;
const BLURB_FS = 13.5;
const META_FS = 10;

function toImageUri(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'object') {
    const candidate = value.uri || value.url || value.secure_url || value.src;
    if (typeof candidate === 'string') return candidate.trim() || null;
  }
  return null;
}

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
    images = [],
  } = spot || {};

  const rankLabel = typeof rank === 'number'
    ? String(rank).padStart(2, '0')
    : String(rank);

  const labelText = `CHAMPION${weekNumber != null ? ` · WEEK ${weekNumber}` : ''}`;
  const metaParts = [category, district, distance].filter(Boolean);
  const imageList = useMemo(() => {
    const raw = Array.isArray(images) ? images : [];
    return raw.map(toImageUri).filter(Boolean);
  }, [images]);
  const [index, setIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(1);
  const listRef = useRef(null);
  const autoplayRef = useRef(null);
  const resumeRef = useRef(null);

  const clearAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  const clearResume = () => {
    if (resumeRef.current) {
      clearTimeout(resumeRef.current);
      resumeRef.current = null;
    }
  };

  const startAutoplay = () => {
    clearAutoplay();
    if (imageList.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % imageList.length;
        listRef.current?.scrollToIndex?.({ index: next, animated: true });
        return next;
      });
    }, 3000);
  };

  useEffect(() => {
    setIndex(0);
    clearAutoplay();
    clearResume();
    startAutoplay();
    return () => {
      clearAutoplay();
      clearResume();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageList.length]);

  const pauseAndResume = () => {
    clearAutoplay();
    clearResume();
    if (imageList.length <= 1) return;
    resumeRef.current = setTimeout(() => {
      startAutoplay();
    }, 1800);
  };

  const onMomentumEnd = (event) => {
    const x = event?.nativeEvent?.contentOffset?.x || 0;
    const w = event?.nativeEvent?.layoutMeasurement?.width || 1;
    const nextIndex = Math.max(0, Math.round(x / w));
    setIndex(nextIndex);
  };

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
      onLayout={(event) => {
        const nextWidth = Math.round(event?.nativeEvent?.layout?.width || 0);
        if (nextWidth > 0 && nextWidth !== cardWidth) {
          setCardWidth(nextWidth);
        }
      }}
    >
      {imageList.length > 0 ? (
        <FlatList
          ref={listRef}
          data={imageList}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={StyleSheet.absoluteFill}
          onScrollBeginDrag={pauseAndResume}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(_, i) => ({
            length: cardWidth,
            offset: cardWidth * i,
            index: i,
          })}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: cardWidth }]}>
              <Image source={{ uri: item }} style={styles.bgImage} resizeMode="cover" />
            </View>
          )}
        />
      ) : (
        <DuotoneVibe vibe={vibe} />
      )}

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

      {imageList.length > 1 ? (
        <View style={styles.dots}>
          {imageList.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
      ) : null}
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
  bgImage: {
    width: '100%',
    height: '100%',
  },
  slide: {
    height: '100%',
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
    fontFamily: fieldGuide.fonts.displayHeavy,
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
  dots: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    gap: 5,
    zIndex: 11,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(244,239,230,0.45)',
  },
  dotActive: {
    backgroundColor: 'rgba(244,239,230,0.95)',
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
