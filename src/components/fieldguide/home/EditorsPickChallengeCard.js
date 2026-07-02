/**
 * EditorsPickChallengeCard — weekly visit challenge for Home.
 *
 * Three numbered stops with visit progress; ghost Start route secondary.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import { LivePulseDot } from '../../home/LivePulseDot';
import DisplayTitle from '../primitives/DisplayTitle';
import MonoMeta from '../primitives/MonoMeta';
import EditorialButton from '../form/EditorialButton';
import DuotoneVibe from '../spot/DuotoneVibe';
import {
  buildChallengeStops,
  getChallengeNodeState,
} from '../../../utils/editorsPickChallengeHelpers';
import { openEditorsRouteInMaps } from '../../../utils/editorsRouteHelpers';

const THUMB = 64;
const NODE = 26;

function ChallengeStopThumb({ vibe, imageUri }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.thumb}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumbImage} />
      ) : (
        <DuotoneVibe vibe={vibe} style={StyleSheet.absoluteFillObject} />
      )}
    </View>
  );
}

function ChallengeNode({ stop }) {

  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const state = getChallengeNodeState(stop);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== 'next') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulse]);

  if (state === 'visited') {
    return (
      <View style={[styles.node, styles.nodeVisited]}>
        <Ionicons name="checkmark" size={14} color={fieldGuide.ink} />
      </View>
    );
  }

  const ringOpacity =
    state === 'next'
      ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] })
      : 0;

  return (
    <View style={styles.nodeWrap}>
      {state === 'next' ? (
        <Animated.View style={[styles.nodeRing, { opacity: ringOpacity }]} />
      ) : null}
      <View style={[styles.node, styles.nodeUnvisited]}>
        <Text style={styles.nodeNumber}>{stop.number}</Text>
      </View>
    </View>
  );
}

function ChallengeStopRow({ stop, onPress }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.stopRow}>
      <View style={styles.nodeCol}>
        <ChallengeNode stop={stop} />
      </View>
      <Pressable
        onPress={() => onPress?.(stop)}
        accessibilityRole="button"
        accessibilityLabel={`Stop ${stop.number}: ${stop.title}${stop.visited ? ', visited' : ''}`}
        accessibilityHint="Opens spot details"
        style={({ pressed }) => [styles.stopMain, { opacity: pressed ? 0.88 : 1 }]}
      >
        <ChallengeStopThumb vibe={stop.vibe} imageUri={stop.imageUri} />
        <View style={styles.stopInfo}>
          <MonoMeta size="spot" style={styles.whenTag}>
            {stop.whenTag.toUpperCase()}
          </MonoMeta>
          <Text style={styles.stopTitle} numberOfLines={2}>
            {stop.title}
          </Text>
          <Text style={styles.stopHook} numberOfLines={2}>
            {stop.hook}
          </Text>
          <Text style={styles.stopMeta} numberOfLines={1}>
            {stop.vibeLabel ? (
              <Text style={styles.vibeText}>{stop.vibeLabel}</Text>
            ) : null}
            {stop.vibeLabel && stop.category ? (
              <Text style={styles.metaSep}> · </Text>
            ) : null}
            {stop.category ? (
              <Text style={styles.categoryText}>{stop.category}</Text>
            ) : null}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function SkeletonBlock({ pulse, style }) {
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.45, 0.9],
          }),
        },
      ]}
    />
  );
}

export function EditorsPickChallengeSkeleton({ style }) {
  const styles = useThemedStyles(createStyles);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View
      style={[styles.card, styles.skeletonCard, style]}
      accessibilityLabel="Loading editor's picks challenge"
      accessibilityRole="progressbar"
    >
      <SkeletonBlock pulse={pulse} style={styles.skeletonHead} />
      <SkeletonBlock pulse={pulse} style={styles.skeletonStop} />
      <SkeletonBlock pulse={pulse} style={styles.skeletonStop} />
      <SkeletonBlock pulse={pulse} style={styles.skeletonStop} />
    </View>
  );
}

export default function EditorsPickChallengeCard({
  challenge,
  onStopPress,
  onStartRoute,
  style,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const stops = useMemo(
    () => buildChallengeStops(challenge?.picks, challenge?.progress?.visitedSpotIds),
    [challenge?.picks, challenge?.progress?.visitedSpotIds],
  );

  if (!stops) return null;

  const { progress, kicker, title, subtitle } = challenge;
  const completed = progress?.completed;
  const visitedCount = progress?.visitedCount ?? 0;
  const total = progress?.total ?? 3;

  const handleStopPress = (stop) => {
    if (stop?.id) onStopPress?.(stop.id, stop);
  };

  const handleStartRoute = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* optional native module */
    }

    const spots = stops.map((s) => s.spot);
    if (onStartRoute) {
      onStartRoute(spots, challenge);
      return;
    }

    const result = await openEditorsRouteInMaps(spots);
    if (!result.ok && result.error) {
      const first = spots[0];
      const c = first?.latitude ?? first?.lat;
      const lng = first?.longitude ?? first?.lng;
      if (c != null && lng != null) {
        const url = Platform.select({
          ios: `https://maps.apple.com/?daddr=${c},${lng}`,
          default: `https://maps.google.com/?daddr=${c},${lng}`,
        });
        Linking.openURL(url).catch(() => {});
      }
    }
  };

  return (
    <View
      style={[styles.card, style]}
      accessibilityLabel={`Editor's picks challenge, ${visitedCount} of ${total} visited`}
    >
      <LinearGradient
        colors={['rgba(232,116,58,0.14)', 'rgba(232,116,58,0.04)', 'rgba(20,22,29,0)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.head}>
        <View style={styles.headText}>
          <View style={styles.kickerRow}>
            <LivePulseDot color={fieldGuide.ember} size={6} />
            <MonoMeta size="spot" style={styles.kicker}>
              {(kicker || 'THIS WEEK · CHALLENGE').toUpperCase()}
            </MonoMeta>
          </View>
          <DisplayTitle size="md" style={styles.title}>
            {title || "Editor's picks"}
          </DisplayTitle>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {completed ? (
          <MonoMeta size="spot" style={styles.completedPill}>
            COMPLETED
          </MonoMeta>
        ) : (
          <View style={styles.progressCol} accessibilityElementsHidden>
            <Text style={styles.progressBig}>
              {visitedCount}
              <Text style={styles.progressSlash}> / </Text>
              {total}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.stops}>
        {stops.map((stop) => (
          <ChallengeStopRow key={stop.id} stop={stop} onPress={handleStopPress} />
        ))}
      </View>

      <View style={styles.foot}>
        <EditorialButton
          variant="ghost"
          size="sm"
          onPress={handleStartRoute}
          accessibilityLabel="Start route in maps"
          leading={
            <Ionicons name="navigate-outline" size={14} color={fieldGuide.creamSoft} />
          }
          style={styles.startBtn}
        >
          Start route
        </EditorialButton>
      </View>
    </View>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  card: {
    marginHorizontal: 22,
    marginBottom: 8,
    borderRadius: fieldGuide.radius.lg,
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  skeletonCard: {
    padding: 16,
    gap: 14,
  },
  skeletonHead: {
    height: 72,
    borderRadius: fieldGuide.radius.md,
    backgroundColor: fieldGuide.inkLine,
  },
  skeletonStop: {
    height: 88,
    borderRadius: fieldGuide.radius.md,
    backgroundColor: fieldGuide.inkLine,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 12,
  },
  headText: {
    flex: 1,
    minWidth: 0,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  kicker: {
    color: fieldGuide.ember,
  },
  title: {
    color: fieldGuide.cream,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: fieldGuide.creamMute,
  },
  progressCol: {
    alignItems: 'center',
    minWidth: 44,
  },
  progressBig: {
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 28,
    lineHeight: 32,
    color: fieldGuide.cream,
  },
  progressSlash: {
    fontFamily: fieldGuide.fonts.display,
    fontSize: 20,
    color: fieldGuide.creamMute,
  },
  completedPill: {
    color: fieldGuide.moss,
    paddingTop: 4,
  },
  stops: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeCol: {
    width: NODE + 8,
    alignItems: 'center',
    paddingTop: THUMB / 2 - NODE / 2,
  },
  nodeWrap: {
    width: NODE + 6,
    height: NODE + 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeRing: {
    position: 'absolute',
    width: NODE + 6,
    height: NODE + 6,
    borderRadius: (NODE + 6) / 2,
    borderWidth: 1.5,
    borderColor: fieldGuide.ember,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeUnvisited: {
    borderWidth: 1.5,
    borderColor: fieldGuide.ember,
    backgroundColor: fieldGuide.inkElev,
  },
  nodeVisited: {
    backgroundColor: fieldGuide.ember,
    borderWidth: 0,
  },
  nodeNumber: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 11,
    color: fieldGuide.emberSoft,
  },
  stopMain: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 18,
    minWidth: 0,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: fieldGuide.radius.sm,
    overflow: 'hidden',
    backgroundColor: fieldGuide.ink,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  stopInfo: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  whenTag: {
    color: fieldGuide.emberSoft,
    marginBottom: 4,
  },
  stopTitle: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 15,
    lineHeight: 20,
    color: fieldGuide.cream,
    marginBottom: 4,
  },
  stopHook: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: fieldGuide.creamSoft,
    marginBottom: 6,
  },
  stopMeta: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    color: fieldGuide.creamMute,
  },
  vibeText: {
    color: fieldGuide.moss,
  },
  metaSep: {
    color: fieldGuide.creamFaint,
  },
  categoryText: {
    color: fieldGuide.creamMute,
    textTransform: 'capitalize',
  },
  foot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: fieldGuide.inkLine,
    marginTop: 4,
    paddingTop: 12,
  },
  startBtn: {
    flexShrink: 0,
  },
});
}
