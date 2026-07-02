/**
 * RatingDots — five small circles + optional decimal value.
 *
 * CSS ref: .rating / .rating .dots i / .rating .dots i.on
 * (css_app.css L512-530)
 *
 * Filled = Math.round(value) circles (ember). Remaining are creamFaint.
 *
 * Props:
 *   value: number              0..5, decimals OK
 *   showNumber?: boolean       default true; renders e.g. "4.2" to the right
 *   size?: 'sm' | 'md'         dots 6px or 8px
 *   color?: string             on-dot color, default ember
 *   offColor?: string          off-dot color, default creamFaint
 *   numberColor?: string       default creamSoft
 *   style?: ViewStyle
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

export default function RatingDots({
  value = 0,
  showNumber = true,
  size = 'sm',
  color,
  offColor,
  numberColor,
  style,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const dim = size === 'md' ? 8 : 6;
  const clamped = Math.max(0, Math.min(5, value));
  const filled = Math.round(clamped);
  const on = color || fieldGuide.ember;
  const off = offColor || fieldGuide.creamFaint;

  return (
    <View style={[styles.row, style]}>
      <View style={styles.dots}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: dim,
                height: dim,
                borderRadius: dim / 2,
                backgroundColor: i < filled ? on : off,
                marginLeft: i === 0 ? 0 : 3,
              },
            ]}
          />
        ))}
      </View>
      {showNumber ? (
        <Text style={[styles.num, { color: numberColor || fieldGuide.creamSoft }]}>
          {clamped.toFixed(1)}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {},
  num: {
    marginLeft: 8,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
});
}
