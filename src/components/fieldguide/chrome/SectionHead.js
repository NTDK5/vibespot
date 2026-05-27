/**
 * SectionHead — "h2 ... see all" headline strip between sections.
 *
 * CSS ref: .section-head / .section-head h2 / .section-head .see-all
 * (css_app.css L591-608)
 *
 * Props:
 *   title: string                               Fraunces 500 / 20 / -0.01em
 *   cta?: { label: string, onPress: () => void }   ember mono 10 caps
 *   style?: ViewStyle
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import fieldGuide from '../../../theme/fieldGuide';

export default function SectionHead({ title, cta, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {cta ? (
        <Pressable
          onPress={cta.onPress}
          accessibilityRole="button"
          hitSlop={10}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.cta}>{cta.label.toUpperCase()}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 14,
  },
  title: {
    flex: 1,
    paddingRight: 12,
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 20,
    letterSpacing: -0.01 * 20,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  cta: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    textTransform: 'uppercase',
    color: fieldGuide.ember,
    includeFontPadding: false,
  },
});
