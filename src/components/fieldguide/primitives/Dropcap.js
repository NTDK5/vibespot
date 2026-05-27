/**
 * Dropcap — leading Fraunces capital that hangs alongside the first
 * line of body copy. RN has no float, so we lay the row out flex
 * and let the body Text wrap within a flex-1 column.
 *
 * Props:
 *   letter: string (single char)
 *   children: ReactNode               body copy (Text or string)
 *   color?: string                    default ember (matches DESIGN_NOTES "every spot has a dropcap")
 *   style?: ViewStyle
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import fieldGuide from '../../../theme/fieldGuide';

const CAP_SIZE = 56;

export default function Dropcap({ letter, children, color, style }) {
  const text = typeof children === 'string'
    ? <Text style={styles.body}>{children}</Text>
    : children;

  return (
    <View style={[styles.row, style]}>
      <Text
        style={[
          styles.cap,
          { color: color || fieldGuide.ember },
        ]}
      >
        {(letter || '').slice(0, 1)}
      </Text>
      <View style={styles.bodyWrap}>{text}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cap: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: CAP_SIZE,
    // 0.85 * 56 ≈ 48 (per spec: tight cap so the body lines next to
    // the letter sit on the same baseline).
    lineHeight: Math.round(CAP_SIZE * 0.85),
    marginRight: 12,
    letterSpacing: -0.02 * CAP_SIZE,
    includeFontPadding: false,
  },
  bodyWrap: {
    flex: 1,
  },
  body: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: fieldGuide.creamSoft,
  },
});
