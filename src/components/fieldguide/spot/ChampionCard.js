/**
 * ChampionCard — weekly discovery hero (wide map-style card).
 *
 * CSS ref: screens/07-home.html L82–399 (.champion-card).
 * Discovery hero — not a magazine cover. Wide 16/11, signal pills,
 * Save / Go there CTAs. Distance lives in signal chips (not on photo).
 *
 * Props:
 *   spot: {
 *     title, hook, vibe, images, category, distance,
 *     rating, ratingCount, savesTrend, isOpen, walkLabel,
 *     isSaved, onSave, onDirections,
 *   }
 *   onPress?: () => void   — tap card background → spot detail
 *   style?: ViewStyle
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../../../theme/fieldGuide';
import DuotoneVibe from './DuotoneVibe';
import RatingDots from './RatingDots';

const TITLE_FS = 24;
const HOOK_FS = 13;
const SIGNAL_FS = 8.5;
const FOOTER_FS = 9;
const BTN_FS = 8.5;

function toImageUri(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'object') {
    const candidate = value.uri || value.url || value.secure_url || value.src;
    if (typeof candidate === 'string') return candidate.trim() || null;
  }
  return null;
}

function PulseDot() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const ringScale = anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 2.4, 1],
  });
  const ringOpacity = anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.55, 0, 0.55],
  });

  return (
    <View style={pulseStyles.wrap}>
      <Animated.View
        style={[
          pulseStyles.ring,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />
      <View style={pulseStyles.dot} />
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  wrap: {
    width: 7,
    height: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  ring: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(232, 116, 58, 0.45)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: fieldGuide.ember,
  },
});

function SignalChip({ label, variant = 'default', icon }) {
  const palette = {
    default: {
      color: 'rgba(244,239,230,0.78)',
      border: 'rgba(244,239,230,0.12)',
      bg: 'rgba(244,239,230,0.08)',
    },
    live: {
      color: fieldGuide.moss,
      border: 'rgba(122, 155, 106, 0.35)',
      bg: 'rgba(122, 155, 106, 0.12)',
    },
    hot: {
      color: fieldGuide.emberSoft,
      border: 'rgba(232, 116, 58, 0.35)',
      bg: 'rgba(232, 116, 58, 0.12)',
    },
  }[variant];

  return (
    <View
      style={[
        styles.signalChip,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={12} color={palette.color} />
      ) : null}
      <Text style={[styles.signalText, { color: palette.color }]} numberOfLines={1}>
        {String(label).toUpperCase()}
      </Text>
    </View>
  );
}

function buildDistanceChipLabel(distance, walkLabel) {
  const dist = distance != null && String(distance).trim() ? String(distance).trim() : '';
  const walk = walkLabel != null && String(walkLabel).trim() ? String(walkLabel).trim() : '';
  if (dist && walk) return `${dist} · ${walk}`;
  if (dist) return dist;
  if (walk) return walk;
  return null;
}

export default function ChampionCard({ spot, onPress, style }) {
  const {
    title = 'Champion',
    hook,
    vibe = 'cafe',
    category,
    distance,
    images = [],
    rating,
    ratingCount,
    savesTrend,
    isOpen,
    walkLabel,
    isSaved = false,
    onSave,
    onDirections,
  } = spot || {};

  const imageList = useMemo(() => {
    const raw = Array.isArray(images) ? images : [];
    return raw.map(toImageUri).filter(Boolean);
  }, [images]);

  const [index, setIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(1);
  const listRef = useRef(null);
  const autoplayRef = useRef(null);
  const resumeRef = useRef(null);

  const ratingValue =
    typeof rating === 'number' && !Number.isNaN(rating) ? rating : 0;
  const reviewCount =
    typeof ratingCount === 'number' && !Number.isNaN(ratingCount)
      ? ratingCount
      : 0;
  const showTrend =
    typeof savesTrend === 'number' && savesTrend > 0 && Number.isFinite(savesTrend);

  const distanceChipLabel = useMemo(
    () => buildDistanceChipLabel(distance, walkLabel),
    [distance, walkLabel],
  );
  const showDistanceIcon = !!(distance != null && String(distance).trim());

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

  const handleGoThere = () => {
    if (onDirections) {
      onDirections();
      return;
    }
    onPress?.();
  };

  return (
    <View style={[styles.shadowWrap, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Champion: ${title}`}
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed ? 0.96 : 1 },
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

        <View style={styles.topBar} pointerEvents="box-none">
          <BlurView tint="dark" intensity={28} style={styles.badge}>
            <PulseDot />
            <Text style={styles.badgeLabel} numberOfLines={1}>
              Week&apos;s top spot
            </Text>
          </BlurView>
          <View style={styles.topBarRight}>
            {imageList.length > 1 ? (
              <BlurView tint="dark" intensity={28} style={styles.slideCountPill}>
                <Text style={styles.slideCountText} numberOfLines={1}>
                  {`${index + 1} / ${imageList.length}`}
                </Text>
              </BlurView>
            ) : null}
            {showTrend ? (
              <BlurView tint="dark" intensity={28} style={styles.trendPill}>
                <Text style={styles.trendText} numberOfLines={1}>
                  {`↑ ${savesTrend} saves`}
                </Text>
              </BlurView>
            ) : null}
          </View>
        </View>

        <LinearGradient
          colors={[
            'rgba(11,12,17,0)',
            'rgba(11,12,17,0.55)',
            'rgba(11,12,17,0.96)',
          ]}
          locations={[0, 0.38, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.body}
          pointerEvents="box-none"
        >
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {hook ? (
            <Text style={styles.hook} numberOfLines={1}>
              {hook}
            </Text>
          ) : null}

          <View style={styles.signals}>
            {isOpen === true ? (
              <SignalChip label="Open now" variant="live" />
            ) : null}
            {distanceChipLabel ? (
              <SignalChip
                label={distanceChipLabel}
                icon={showDistanceIcon ? 'location-outline' : undefined}
              />
            ) : null}
            {category ? <SignalChip label={category} /> : null}
            <SignalChip label="Trending" variant="hot" />
          </View>

          <View style={styles.footer}>
            <View style={styles.ratingRow}>
              <RatingDots value={ratingValue} showNumber={false} size="sm" />
              <Text style={styles.ratingMeta}>
                {`${ratingValue.toFixed(1)} · ${reviewCount}`}
              </Text>
            </View>
            <View style={styles.actions}>
              <Pressable
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onSave?.();
                }}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Unsave spot' : 'Save spot'}
                style={({ pressed }) => [
                  styles.btnGhost,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.btnGhostText}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleGoThere();
                }}
                accessibilityRole="button"
                accessibilityLabel="Go there"
                style={({ pressed }) => [
                  styles.btnPrimary,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Text style={styles.btnPrimaryText}>Go there</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: '100%',
    borderRadius: fieldGuide.radius.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.35,
        shadowRadius: 40,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  card: {
    width: '100%',
    aspectRatio: 16 / 11,
    borderRadius: fieldGuide.radius.xl,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    position: 'relative',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  slide: {
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    zIndex: 3,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  slideCountPill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,239,230,0.14)',
    backgroundColor: 'rgba(11,12,17,0.72)',
    overflow: 'hidden',
  },
  slideCountText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wide(9),
    textTransform: 'uppercase',
    color: 'rgba(244,239,230,0.85)',
    includeFontPadding: false,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,239,230,0.14)',
    backgroundColor: 'rgba(11,12,17,0.72)',
    overflow: 'hidden',
    flexShrink: 1,
  },
  badgeLabel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wide(9),
    textTransform: 'uppercase',
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  trendPill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(122, 155, 106, 0.35)',
    backgroundColor: 'rgba(11,12,17,0.72)',
    overflow: 'hidden',
  },
  trendText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wide(9),
    textTransform: 'uppercase',
    color: fieldGuide.moss,
    includeFontPadding: false,
  },
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 28,
    zIndex: 2,
  },
  title: {
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: TITLE_FS,
    lineHeight: Math.round(TITLE_FS * 1.08),
    letterSpacing: fieldGuide.tracking.tight(TITLE_FS),
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  hook: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: HOOK_FS,
    lineHeight: Math.round(HOOK_FS * 1.35),
    color: fieldGuide.creamSoft,
  },
  signals: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  signalText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: SIGNAL_FS,
    letterSpacing: fieldGuide.tracking.wide(SIGNAL_FS),
    includeFontPadding: false,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  ratingMeta: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: FOOTER_FS,
    letterSpacing: fieldGuide.tracking.wide(FOOTER_FS),
    textTransform: 'uppercase',
    color: 'rgba(244,239,230,0.72)',
    includeFontPadding: false,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  btnGhost: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,239,230,0.18)',
    backgroundColor: 'rgba(244,239,230,0.08)',
  },
  btnGhostText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: BTN_FS,
    letterSpacing: fieldGuide.tracking.wide(BTN_FS),
    textTransform: 'uppercase',
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  btnPrimary: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.ember,
    backgroundColor: fieldGuide.ember,
  },
  btnPrimaryText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: BTN_FS,
    letterSpacing: fieldGuide.tracking.wide(BTN_FS),
    textTransform: 'uppercase',
    color: fieldGuide.inkDeep,
    includeFontPadding: false,
  },
});
