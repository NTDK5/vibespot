/**
 * IndexStamp — small mono caps stamp anchored to a photo corner.
 *
 * CSS ref: .spot-photo .index (css_app.css L456-465). Typical
 * children: "NO. 042" or "0.4 MI".
 *
 * Props:
 *   children: string
 *   position?: 'tl' | 'tr' | 'bl' | 'br'    default 'tl'
 *   color?: string                          default rgba(255,255,255,0.92)
 *   style?: TextStyle
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

const POSITIONS = {
  tl: { top: 12, left: 14 },
  tr: { top: 12, right: 14 },
  bl: { bottom: 12, left: 14 },
  br: { bottom: 12, right: 14 },
};

const FS = 9.5;

export default function IndexStamp({
  children,
  position = 'tl',
  color = 'rgba(255,255,255,0.92)',
  style,
}) {
  const styles = useThemedStyles(createStyles);
  const pos = POSITIONS[position] || POSITIONS.tl;
  return (
    <Text
      style={[
        styles.base,
        pos,
        { color },
        style,
      ]}
      numberOfLines={1}
    >
      {String(children).toUpperCase()}
    </Text>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  base: {
    position: 'absolute',
    fontFamily: fieldGuide.fonts.mono,
    fontSize: FS,
    letterSpacing: fieldGuide.tracking.widest(FS),
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
});
}
