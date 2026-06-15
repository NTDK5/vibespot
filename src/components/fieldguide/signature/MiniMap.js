/**
 * MiniMap — spot location preview or drawn district sketch fallback.
 *
 * When `location` has valid lat/lng and `drawn` is false, renders a
 * non-interactive Leaflet preview (Carto tiles, no Google Maps cost).
 * Otherwise shows the hand-drawn SVG sketch.
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';

import { LeafletMap } from '../../LeafletMap';
import fieldGuide from '../../../theme/fieldGuide';
import { fieldGuideTileStyle } from '../../../utils/mapStyle';

const VBW = 320;
const VBH = 180;

function hasValidLocation(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function DrawnSketch() {
  return (
    <>
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
    </>
  );
}

function LiveMiniMap({ location, style, onPress }) {
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  const [mapHeight, setMapHeight] = useState(0);

  const markers = useMemo(
    () => [{ id: 'spot', lat, lng, color: fieldGuide.ember }],
    [lat, lng],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Open directions' : undefined}
      onLayout={(event) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        if (nextHeight > 0 && nextHeight !== mapHeight) {
          setMapHeight(nextHeight);
        }
      }}
      style={[styles.container, style]}
    >
      {mapHeight > 0 ? (
        <LeafletMap
          latitude={lat}
          longitude={lng}
          height={mapHeight}
          interactive={false}
          markers={markers}
          tileStyle={fieldGuideTileStyle}
          style={styles.mapFill}
        />
      ) : null}
    </Pressable>
  );
}

export default function MiniMap({ location, drawn = true, style, onPress }) {
  const useLiveMap = !drawn && hasValidLocation(location);

  if (useLiveMap) {
    return (
      <LiveMiniMap location={location} style={style} onPress={onPress} />
    );
  }

  return (
    <View style={[styles.container, style]}>
      <DrawnSketch />
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
  mapFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: fieldGuide.radius.lg,
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
