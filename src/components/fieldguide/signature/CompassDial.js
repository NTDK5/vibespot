/**
 * CompassDial — drawn compass leitmotif. Appears on splash, empty,
 * loading, and offline screens.
 *
 * Implementation: a static SVG composition wrapped in an
 * Animated.View. When `spinning` the wrapper rotates 0→360 over 8s on
 * loop; when `breathing` the opacity pulses 0.5 → 1 → 0.5 over 3s.
 *
 * Props:
 *   size?: number             default 120
 *   spinning?: boolean        default false
 *   breathing?: boolean       default false
 *   color?: string            default cream
 *   accent?: string           default ember (north needle)
 *   style?: ViewStyle
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

const VIEWBOX = 200;

export default function CompassDial({
  size = 120,
  spinning = false,
  breathing = false,
  color,
  accent,
  style,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const ringColor = color || fieldGuide.cream;
  const needleColor = accent || fieldGuide.ember;

  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (spinning) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 200 });
    }
    return () => cancelAnimation(rotation);
  }, [spinning, rotation]);

  useEffect(() => {
    if (breathing) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(opacity);
      opacity.value = withTiming(1, { duration: 200 });
    }
    return () => cancelAnimation(opacity);
  }, [breathing, opacity]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  // 16 ticks around the perimeter — every 4th (N/E/S/W) is longer.
  const ticks = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i / 16) * 360;
    const isCardinal = i % 4 === 0;
    const outer = VIEWBOX / 2 - 4;
    const inner = isCardinal ? VIEWBOX / 2 - 18 : VIEWBOX / 2 - 12;
    const rad = (angle - 90) * (Math.PI / 180);
    const x1 = VIEWBOX / 2 + Math.cos(rad) * outer;
    const y1 = VIEWBOX / 2 + Math.sin(rad) * outer;
    const x2 = VIEWBOX / 2 + Math.cos(rad) * inner;
    const y2 = VIEWBOX / 2 + Math.sin(rad) * inner;
    return { x1, y1, x2, y2, key: `t${i}`, isCardinal };
  });

  // Cardinal letter positions slightly inside the outer ring.
  const letters = [
    { c: 'N', x: VIEWBOX / 2, y: 38 },
    { c: 'E', x: VIEWBOX - 32, y: VIEWBOX / 2 + 4 },
    { c: 'S', x: VIEWBOX / 2, y: VIEWBOX - 28 },
    { c: 'W', x: 32, y: VIEWBOX / 2 + 4 },
  ];

  return (
    <Animated.View
      style={[{ width: size, height: size }, wrapStyle, style]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={VIEWBOX / 2 - 1}
          stroke={ringColor}
          strokeOpacity={0.45}
          strokeWidth={1}
          fill="none"
        />
        <Circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={VIEWBOX / 2 - 16}
          stroke={ringColor}
          strokeOpacity={0.2}
          strokeWidth={1}
          fill="none"
        />
        <G>
          {ticks.map((t) => (
            <Line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={ringColor}
              strokeOpacity={t.isCardinal ? 0.6 : 0.3}
              strokeWidth={t.isCardinal ? 1.3 : 0.8}
              strokeLinecap="round"
            />
          ))}
        </G>
        <G>
          {letters.map((l) => (
            <SvgText
              key={l.c}
              x={l.x}
              y={l.y}
              fill={ringColor}
              fillOpacity={0.7}
              fontFamily={fieldGuide.fonts.mono}
              fontSize={14}
              textAnchor="middle"
            >
              {l.c}
            </SvgText>
          ))}
        </G>
        <Polygon
          points={`${VIEWBOX / 2},${VIEWBOX / 2 - 56} ${VIEWBOX / 2 - 8},${VIEWBOX / 2 + 4} ${VIEWBOX / 2 + 8},${VIEWBOX / 2 + 4}`}
          fill={needleColor}
        />
        <Polygon
          points={`${VIEWBOX / 2},${VIEWBOX / 2 + 56} ${VIEWBOX / 2 - 8},${VIEWBOX / 2 - 4} ${VIEWBOX / 2 + 8},${VIEWBOX / 2 - 4}`}
          fill={ringColor}
          fillOpacity={0.85}
        />
        <Circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={4}
          fill={fieldGuide.ink}
          stroke={ringColor}
          strokeWidth={1}
        />
      </Svg>
    </Animated.View>
  );
}

// styles intentionally empty — sizes flow from the size prop.
function createStyles(fieldGuide) {
  return StyleSheet.create({});
}
