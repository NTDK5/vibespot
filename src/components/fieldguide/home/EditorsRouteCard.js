/**
 * EditorsRouteCard — threaded editor's route for Home (07-home.html spirit).
 *
 * Vertical numbered stops, dashed spine, walk legs, footer + Start route.
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

import fieldGuide from '../../../theme/fieldGuide';
import { LivePulseDot } from '../../home/LivePulseDot';
import DisplayTitle from '../primitives/DisplayTitle';
import MonoMeta from '../primitives/MonoMeta';
import EditorialButton from '../form/EditorialButton';
import DuotoneVibe from '../spot/DuotoneVibe';
import {
  buildEditorsRoute,
  openEditorsRouteInMaps,
} from '../../../utils/editorsRouteHelpers';

const THUMB = 64;
const NODE = 26;
const SPINE_DASH = 5;
const SPINE_GAP = 4;

function DashedSpine({ segments = 6 }) {
  return (
    <View style={styles.spine}>
      {Array.from({ length: segments }).map((_, i) => (
        <View key={i} style={styles.spineDash} />
      ))}
    </View>
  );
}

function RouteStopThumb({ vibe, imageUri }) {
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

function WalkLegRow({ leg }) {
  if (!leg?.label) return null;
  return (
    <View style={styles.legRow} accessibilityElementsHidden importantForAccessibility="no">
      <View style={styles.legSpineGap} />
      <View style={styles.legContent}>
        <Ionicons name="footsteps-outline" size={13} color={fieldGuide.creamMute} />
        <Text style={styles.legText}>{leg.label}</Text>
      </View>
    </View>
  );
}

function RouteStopRow({ stop, isLast, onPress }) {
  return (
    <View style={styles.stopRow}>
      <View style={styles.nodeCol}>
        <View style={[styles.node, stop.number === 1 && styles.nodeStart]}>
          <Text style={styles.nodeText}>{stop.number}</Text>
        </View>
        {!isLast ? <DashedSpine segments={7} /> : null}
      </View>

      <Pressable
        onPress={() => onPress?.(stop)}
        accessibilityRole="button"
        accessibilityLabel={`Stop ${stop.number}: ${stop.title}`}
        accessibilityHint="Opens spot details"
        style={({ pressed }) => [styles.stopMain, { opacity: pressed ? 0.88 : 1 }]}
      >
        <RouteStopThumb vibe={stop.vibe} imageUri={stop.imageUri} />
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

export function EditorsRouteSkeleton({ style }) {
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
      accessibilityLabel="Loading editor's route"
      accessibilityRole="progressbar"
    >
      <SkeletonBlock pulse={pulse} style={styles.skeletonHead} />
      <SkeletonBlock pulse={pulse} style={styles.skeletonStop} />
      <SkeletonBlock pulse={pulse} style={styles.skeletonStop} />
      <SkeletonBlock pulse={pulse} style={styles.skeletonFoot} />
    </View>
  );
}

export default function EditorsRouteCard({
  picks,
  routeMeta = null,
  onStopPress,
  onStartRoute,
  style,
}) {
  const route = useMemo(
    () => buildEditorsRoute(picks, routeMeta || {}),
    [picks, routeMeta],
  );
  if (!route) return null;

  const footerParts = [
    route.footer.distanceLabel
      ? { bold: true, text: route.footer.distanceLabel }
      : null,
    route.footer.durationLabel ? { text: route.footer.durationLabel } : null,
    route.footer.endsNear ? { text: `ends near ${route.footer.endsNear}` } : null,
  ].filter(Boolean);

  const handleStopPress = (stop) => {
    if (stop?.id) onStopPress?.(stop.id, stop);
  };

  const handleStartRoute = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* optional native module */
    }

    const spots = route.stops.map((s) => s.spot);
    if (onStartRoute) {
      onStartRoute(spots, route);
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
      accessibilityLabel={`Editor's route, ${route.title}, ${route.stopCount} stops`}
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
        <View style={styles.editorAv} accessibilityElementsHidden>
          <Text style={styles.editorAvText}>F</Text>
        </View>
        <View style={styles.headText}>
          <View style={styles.kickerRow}>
            <LivePulseDot color={fieldGuide.ember} size={6} />
            <MonoMeta size="spot" style={styles.kicker}>
              {route.kicker.toUpperCase()}
            </MonoMeta>
          </View>
          <DisplayTitle size="md" style={styles.routeTitle}>
            {route.title}
          </DisplayTitle>
          <Text style={styles.byline}>{route.byline}</Text>
        </View>
        <View style={styles.stopCountCol} accessibilityElementsHidden>
          <Text style={styles.stopCountBig}>{route.stopCount}</Text>
          <MonoMeta size="spot" style={styles.stopCountSub}>
            STOPS
          </MonoMeta>
        </View>
      </View>

      <View style={styles.stops}>
        {route.stops.map((stop, index) => (
          <React.Fragment key={stop.id || index}>
            <RouteStopRow
              stop={stop}
              isLast={index === route.stops.length - 1}
              onPress={handleStopPress}
            />
            {index < route.legs.length ? (
              <WalkLegRow leg={route.legs[index]} />
            ) : null}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.foot}>
        {footerParts.length ? (
          <Text style={styles.footerSummary} numberOfLines={2}>
            {footerParts.map((part, i) => (
              <React.Fragment key={part.text}>
                {i > 0 ? <Text style={styles.footerSep}> · </Text> : null}
                {part.bold ? (
                  <Text style={styles.footerBold}>{part.text}</Text>
                ) : (
                  part.text
                )}
              </React.Fragment>
            ))}
          </Text>
        ) : (
          <Text style={styles.footerSummary}>
            {route.cityName} · editor picks
          </Text>
        )}
        <EditorialButton
          size="sm"
          onPress={handleStartRoute}
          accessibilityLabel="Start route in maps"
          leading={
            <Ionicons name="navigate" size={14} color="#FFF8F1" />
          }
          style={styles.startBtn}
        >
          Start route
        </EditorialButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 22,
    marginBottom: 8,
    borderRadius: fieldGuide.radius.lg,
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    overflow: 'hidden',
    paddingBottom: 16,
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
  skeletonFoot: {
    height: 44,
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
  editorAv: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: fieldGuide.ink,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorAvText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 14,
    color: fieldGuide.ember,
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
  routeTitle: {
    color: fieldGuide.cream,
    marginBottom: 4,
  },
  byline: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: fieldGuide.creamMute,
  },
  stopCountCol: {
    alignItems: 'center',
    minWidth: 44,
  },
  stopCountBig: {
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 28,
    lineHeight: 32,
    color: fieldGuide.cream,
  },
  stopCountSub: {
    color: fieldGuide.creamMute,
    marginTop: 2,
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
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 1.5,
    borderColor: fieldGuide.creamMute,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fieldGuide.inkElev,
    zIndex: 1,
  },
  nodeStart: {
    borderColor: fieldGuide.ember,
    backgroundColor: 'rgba(232,116,58,0.12)',
  },
  nodeText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 11,
    color: fieldGuide.cream,
  },
  spine: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: SPINE_GAP,
  },
  spineDash: {
    width: 1.5,
    height: SPINE_DASH,
    borderRadius: 1,
    backgroundColor: fieldGuide.creamFaint,
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
  legRow: {
    flexDirection: 'row',
    marginTop: -8,
    marginBottom: 10,
  },
  legSpineGap: {
    width: NODE + 8,
  },
  legContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  legText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: 0.3,
    color: fieldGuide.creamMute,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: fieldGuide.inkLine,
    marginTop: 4,
    paddingTop: 14,
  },
  footerSummary: {
    flex: 1,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: fieldGuide.creamSoft,
  },
  footerBold: {
    fontFamily: fieldGuide.fonts.sansSemi,
    color: fieldGuide.cream,
  },
  footerSep: {
    color: fieldGuide.creamFaint,
  },
  startBtn: {
    flexShrink: 0,
  },
});
