/**
 * PostmarkStamp — circular stamp with perimeter text and a center node.
 *
 * The single most-distinctive Field Guide signature. Used on the splash,
 * save confirmation, error screen, empty state, and achievement badges.
 *
 * Implementation note: react-native-svg ships <TextPath> but cannot host
 * arbitrary RN views in <ForeignObject>. So we layer an absolutely-
 * positioned <View> (for `center`) over the SVG ring.
 *
 * Props:
 *   perimeterText: string                 e.g. "VOL. 04 · ISSUE 28 · LISBON"
 *   center?: ReactNode                    rendered absolutely in the middle
 *   size?: number                         default 96
 *   color?: string                        default cream
 *   ringStyle?: 'hairline' | 'double'     default 'hairline'
 *   tilt?: number                         degrees, default 0
 *   style?: ViewStyle
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Path,
  Text as SvgText,
  TextPath,
} from 'react-native-svg';

import fieldGuide from '../../../theme/fieldGuide';

function buildPerimeterContent(text) {
  // Pad with dot separators and repeat so the ring is always full.
  const cleaned = String(text).trim();
  if (!cleaned) return '';
  const segment = `${cleaned}  ·  `;
  // Repeat enough that an 8px font on a ~96px ring (~300px circumference)
  // is fully populated; consumers can pass already-padded text.
  const reps = Math.max(2, Math.ceil(80 / cleaned.length));
  return segment.repeat(reps);
}

export default function PostmarkStamp({
  perimeterText,
  center,
  size = 96,
  color,
  ringStyle = 'hairline',
  tilt = 0,
  style,
}) {
  const fill = color || fieldGuide.cream;
  const cx = size / 2;
  const cy = size / 2;
  // Inset the text ring from the outer ring by a small margin so the
  // glyphs don't kiss the outer stroke.
  const ringPad = Math.max(6, size * 0.085);
  const r = size / 2 - ringPad;

  const pathD = `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`;

  const fontSize = Math.max(7, Math.round(size * 0.085));
  const letterSpacing = Math.round(fontSize * 0.2);

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, transform: [{ rotate: `${tilt}deg` }] },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <Path id="ring" d={pathD} />
        </Defs>
        <Circle
          cx={cx}
          cy={cy}
          r={size / 2 - 1}
          stroke={fill}
          strokeOpacity={0.55}
          strokeWidth={1}
          fill="none"
        />
        {ringStyle === 'double' ? (
          <Circle
            cx={cx}
            cy={cy}
            r={size / 2 - 5}
            stroke={fill}
            strokeOpacity={0.32}
            strokeWidth={1}
            fill="none"
          />
        ) : null}
        <SvgText
          fill={fill}
          fontFamily={fieldGuide.fonts.mono}
          fontSize={fontSize}
          letterSpacing={letterSpacing}
        >
          <TextPath href="#ring" startOffset="0">
            {buildPerimeterContent(perimeterText)}
          </TextPath>
        </SvgText>
      </Svg>

      {center ? (
        <View style={styles.center} pointerEvents="none">
          {center}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
