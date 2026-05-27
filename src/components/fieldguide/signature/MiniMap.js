/**
 * MiniMap — drawn-by-hand district sketch.
 *
 * CSS ref: .mini-map (css_app.css L728-738). Phase-1 deliverable
 * renders only the `drawn` mode; `location` is accepted but ignored
 * until Phase 4 wires real geolocation.
 *
 * Props:
 *   location?: { lat: number, lng: number }      ignored in Phase 1
 *   drawn?: boolean                              default true
 *   style?: ViewStyle
 *
 * Open TODO (Phase 4): swap the SVG sketch for a real react-native-maps
 * preview keyed on `location`.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';

import fieldGuide from '../../../theme/fieldGuide';

const VBW = 320;
const VBH = 180;

export default function MiniMap({ location, drawn = true, style }) {
  return (
    <View style={[styles.container, style]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VBW} ${VBH}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Line
          x1={0} y1={42} x2={VBW} y2={56}
          stroke={fieldGuide.cream}
          strokeOpacity={0.18}
          strokeWidth={1}
        />
        <Line
          x1={0} y1={120} x2={VBW} y2={108}
          stroke={fieldGuide.cream}
          strokeOpacity={0.18}
          strokeWidth={1}
        />
        <Line
          x1={28} y1={0} x2={64} y2={VBH}
          stroke={fieldGuide.cream}
          strokeOpacity={0.14}
          strokeWidth={1}
        />
        <Path
          d={`M 0 ${VBH - 30} C 80 ${VBH - 70}, 180 ${VBH - 10}, ${VBW} ${VBH - 50}`}
          stroke={fieldGuide.moss}
          strokeOpacity={0.45}
          strokeWidth={2}
          fill="none"
        />
        <Line
          x1={VBW / 2 - 14} y1={VBH / 2}
          x2={VBW / 2 + 14} y2={VBH / 2}
          stroke={fieldGuide.cream}
          strokeOpacity={0.55}
          strokeWidth={1}
        />
        <Line
          x1={VBW / 2} y1={VBH / 2 - 14}
          x2={VBW / 2} y2={VBH / 2 + 14}
          stroke={fieldGuide.cream}
          strokeOpacity={0.55}
          strokeWidth={1}
        />
        <Circle
          cx={VBW / 2}
          cy={VBH / 2}
          r={5}
          fill={fieldGuide.ember}
          stroke={fieldGuide.inkDeep}
          strokeWidth={1.4}
        />
        <SvgText
          x={VBW - 18}
          y={22}
          fill={fieldGuide.cream}
          fillOpacity={0.6}
          fontFamily={fieldGuide.fonts.mono}
          fontSize={9}
          textAnchor="end"
          letterSpacing={2}
        >
          N
        </SvgText>
        <Line
          x1={VBW - 24} y1={26}
          x2={VBW - 24} y2={42}
          stroke={fieldGuide.cream}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      </Svg>

      <View style={styles.legend} pointerEvents="none">
        <Text style={styles.legendText}>SKETCH · NOT TO SCALE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: fieldGuide.radius.lg,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  legend: {
    position: 'absolute',
    left: 12,
    bottom: 10,
  },
  legendText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 8.5,
    letterSpacing: fieldGuide.tracking.wider(8.5),
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
});
