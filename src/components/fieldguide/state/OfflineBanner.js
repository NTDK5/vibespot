/**
 * OfflineBanner — two forms of "off the grid" UI.
 *
 *   - mode='banner' (default): rose horizontal strip with a pulsing dot,
 *     intended to sit at the top of any screen.
 *   - mode='screen': full-screen layout with the signal-art SVG,
 *     editorial title, mono last-sync stamp, retry button.
 *
 * Source: screens/25-offline.html.
 *
 * Props:
 *   mode?: 'banner' | 'screen'        default 'banner'
 *   lastSyncAt?: Date | string        renders inside the mono caption
 *   onRetry?: () => void
 *   style?: ViewStyle
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import DisplayTitle from '../primitives/DisplayTitle';
import MonoMeta from '../primitives/MonoMeta';
import EditorialButton from '../form/EditorialButton';

function formatSync(value) {
  if (!value) return 'NIL';
  if (value instanceof Date) {
    const hh = String(value.getHours()).padStart(2, '0');
    const mm = String(value.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return String(value).toUpperCase();
}

function PulsingDot({ size = 7, color }) {
  const { fieldGuide } = useTheme();
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color || fieldGuide.rose,
        },
        aStyle,
      ]}
    />
  );
}

function SignalArt({ size = 180 }) {
  const { fieldGuide } = useTheme();
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
        <Circle cx="100" cy="100" r="98" stroke={fieldGuide.cream} strokeOpacity={0.06} strokeWidth={0.6} />
        <Circle cx="100" cy="100" r="78" stroke={fieldGuide.cream} strokeOpacity={0.08} strokeWidth={0.6} strokeDasharray="2 4" />
        <Circle cx="100" cy="100" r="58" stroke={fieldGuide.cream} strokeOpacity={0.1} strokeWidth={0.6} />
        <Circle cx="100" cy="100" r="38" stroke={fieldGuide.cream} strokeOpacity={0.14} strokeWidth={0.6} />
        <Circle cx="100" cy="100" r="16" fill="rgba(201,95,110,0.2)" stroke={fieldGuide.rose} strokeWidth={1.5} />
        <Line x1="50" y1="50" x2="150" y2="150" stroke={fieldGuide.rose} strokeWidth={2} strokeLinecap="round" />
        <SvgText
          x="100"
          y="184"
          fill={fieldGuide.creamMute}
          fontFamily={fieldGuide.fonts.mono}
          fontSize="8"
          textAnchor="middle"
          letterSpacing={3}
        >
          SIGNAL · NIL
        </SvgText>
      </Svg>
    </View>
  );
}

function Banner({ lastSyncAt, style }) {
  const bannerStyles = useThemedStyles(createBannerStyles);
  return (
    <View style={[bannerStyles.bar, style]}>
      <PulsingDot />
      <Text style={bannerStyles.text} numberOfLines={1}>
        {`OFF THE GRID · LAST SYNC ${formatSync(lastSyncAt)}`}
      </Text>
    </View>
  );
}

function Screen({ lastSyncAt, onRetry, style }) {
  const { fieldGuide } = useTheme();
  const screenStyles = useThemedStyles(createScreenStyles);
  return (
    <View style={[screenStyles.wrap, style]}>
      <SignalArt />
      <MonoMeta size="eyebrow" color={fieldGuide.rose} style={{ marginTop: 22 }}>
        OFF THE GRID
      </MonoMeta>
      <DisplayTitle size="lg" italic="signal." style={screenStyles.title}>
        We've lost the signal.
      </DisplayTitle>
      <Text style={screenStyles.body}>
        No connection where you are right now. Your saved spots are still here,
        and we'll sync the moment you're back.
      </Text>
      <MonoMeta size="eyebrow" style={{ marginTop: 18 }}>
        {`LAST SYNC · ${formatSync(lastSyncAt)}`}
      </MonoMeta>
      {onRetry ? (
        <EditorialButton
          variant="ghost"
          block
          onPress={onRetry}
          style={screenStyles.cta}
        >
          Try again
        </EditorialButton>
      ) : null}
    </View>
  );
}

export default function OfflineBanner({
  mode = 'banner',
  lastSyncAt,
  onRetry,
  style,
}) {
  if (mode === 'screen') {
    return <Screen lastSyncAt={lastSyncAt} onRetry={onRetry} style={style} />;
  }
  return <Banner lastSyncAt={lastSyncAt} style={style} />;
}

function createBannerStyles(fieldGuide) {

  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginHorizontal: 22,
      backgroundColor: 'rgba(201,95,110,0.12)',
      borderColor: 'rgba(201,95,110,0.3)',
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: fieldGuide.radius.md,
    },
    text: {
      marginLeft: 12,
      flex: 1,
      fontFamily: fieldGuide.fonts.mono,
      fontSize: 10,
      letterSpacing: fieldGuide.tracking.widest(10),
      textTransform: 'uppercase',
      color: fieldGuide.rose,
      includeFontPadding: false,
    },
  });
}

function createScreenStyles(fieldGuide) {

  return StyleSheet.create({
    wrap: {
      flex: 1,
      paddingHorizontal: 28,
      paddingVertical: 40,
      backgroundColor: fieldGuide.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginTop: 12,
      textAlign: 'center',
      maxWidth: 280,
    },
    body: {
      marginTop: 14,
      fontFamily: fieldGuide.fonts.sans,
      fontSize: 14,
      lineHeight: 22,
      color: fieldGuide.creamSoft,
      textAlign: 'center',
      maxWidth: 320,
    },
    cta: {
      marginTop: 24,
      width: '100%',
      maxWidth: 280,
      alignSelf: 'center',
    },
  });
}
