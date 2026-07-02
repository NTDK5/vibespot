import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const ICONS = {
  near: 'compass-outline',
  visit: 'star-outline',
  save: 'bookmark-outline',
};

function iconStyles(fieldGuide) {

  return {
    near: { bg: 'rgba(232, 116, 58, 0.14)', color: fieldGuide.ember },
    visit: { bg: 'rgba(201, 162, 75, 0.14)', color: fieldGuide.gold },
    save: { bg: 'rgba(122, 155, 106, 0.14)', color: fieldGuide.moss },
  };
}

export default function QuickStatChip({
  variant = 'near',
  value = 0,
  label,
  highlight = false,
  trend,
  onPress,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const iconName = ICONS[variant] || ICONS.near;
  const stylesByVariant = iconStyles(fieldGuide);
  const iconStyle = stylesByVariant[variant] || stylesByVariant.near;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.chip,
        highlight ? styles.chipHighlight : null,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconStyle.bg }]}>
        <Ionicons name={iconName} size={15} color={iconStyle.color} />
      </View>
      <View style={styles.data}>
        <View style={styles.numRow}>
          <Text style={styles.num}>{String(value)}</Text>
          {trend ? <Text style={styles.trend}>{trend}</Text> : null}
        </View>
        <Text style={styles.lbl}>{label.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: fieldGuide.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: fieldGuide.inkElev,
    flexShrink: 0,
  },
  chipHighlight: {
    borderColor: 'rgba(232, 116, 58, 0.35)',
    backgroundColor: 'rgba(232, 116, 58, 0.08)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: fieldGuide.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  data: {
    minWidth: 0,
  },
  numRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  num: {
    fontFamily: fieldGuide.fonts.displayHeavy,
    fontSize: 18,
    lineHeight: 18,
    letterSpacing: fieldGuide.tracking.tight(18),
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  trend: {
    marginLeft: 2,
    marginBottom: 1,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 8,
    letterSpacing: fieldGuide.tracking.wide(8),
    color: fieldGuide.moss,
    includeFontPadding: false,
  },
  lbl: {
    marginTop: 2,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 8,
    letterSpacing: fieldGuide.tracking.wide(8),
    textTransform: 'uppercase',
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
});
}
