/**
 * Pill — small uppercase mono chip used for tags, status, filters.
 * PillRow renders a horizontally-scrollable row of pills.
 *
 * CSS ref: .pill / .pill.solid / .pill.ember / .pill.moss / .pill.dot
 * (css_app.css L322-358)
 *
 * Props (Pill):
 *   children: string                                       label text
 *   variant?: 'default' | 'solid' | 'ember' | 'moss' | 'glass'
 *                                                          default 'default'.
 *                                                          'glass' is the
 *                                                          MapScreen chip
 *                                                          variant — a
 *                                                          translucent ink
 *                                                          fill that floats
 *                                                          over the tiles.
 *   leading?: ReactNode                                    icon at the left
 *   dot?: boolean                                          5x5 currentColor leading dot
 *   onPress?: () => void                                   wraps in Pressable
 *   style?: ViewStyle
 *
 * Props (PillRow):
 *   children: ReactNode[]
 *   gap?: number                 default 8
 *   paddingHorizontal?: number   default 22
 *   style?: ViewStyle
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';

function getVariantStyles(fieldGuide, isDark) {

  return {
    default: {
      bg: 'transparent',
      border: fieldGuide.inkLine2,
      color: fieldGuide.creamSoft,
    },
    solid: {
      bg: fieldGuide.creamFill,
      border: fieldGuide.creamFill,
      color: fieldGuide.onCreamFill,
    },
    ember: {
      bg: fieldGuide.ember,
      border: fieldGuide.ember,
      color: fieldGuide.onEmber,
    },
    moss: {
      bg: fieldGuide.moss,
      border: fieldGuide.moss,
      color: fieldGuide.onDark,
    },
    glass: {
      bg: isDark ? 'rgba(20,22,29,0.78)' : 'rgba(244,239,230,0.82)',
      border: fieldGuide.inkLine,
      color: isDark ? fieldGuide.onDark : fieldGuide.text,
    },
  };
}

export function Pill({
  children,
  variant = 'default',
  leading,
  dot = false,
  onPress,
  style,
}) {
  const { fieldGuide, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const v = getVariantStyles(fieldGuide, isDark)[variant] || getVariantStyles(fieldGuide, isDark).default;
  const content = (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
        },
        style,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      {dot ? <View style={[styles.dot, { backgroundColor: v.color }]} /> : null}
      <Text style={[styles.label, { color: v.color }]} numberOfLines={1}>
        {String(children).toUpperCase()}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

export function PillRow({ children, gap = 8, paddingHorizontal = 22, style }) {
  const styles = useThemedStyles(createStyles);
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        { paddingHorizontal },
        style,
      ]}
    >
      {items.map((child, i) => (
        <View key={i} style={i > 0 ? { marginLeft: gap } : null}>
          {child}
        </View>
      ))}
    </ScrollView>
  );
}

const PILL_FS = 9.5;

function createStyles(fieldGuide) {
  return StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: PILL_FS,
    letterSpacing: fieldGuide.tracking.wide(PILL_FS),
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  leading: {
    marginRight: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
}

export default Pill;
