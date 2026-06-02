/**
 * CategoryGrid — 3-column category picker for Add/Edit spot flows.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../../../theme/fieldGuide';
import MonoMeta from '../primitives/MonoMeta';

export default function CategoryGrid({
  categories = [],
  value,
  onChange,
  counts = {},
  style,
}) {
  return (
    <View style={[styles.grid, style]}>
      {categories.map((cat) => {
        const on = value === cat.id;
        const count = counts[cat.id];
        const countLabel =
          typeof count === 'number' ? String(count) : '—';
        return (
          <Pressable
            key={cat.id}
            onPress={() => onChange(cat.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={cat.label}
            style={({ pressed }) => [
              styles.cell,
              on && styles.cellOn,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons
              name={cat.icon || 'ellipse-outline'}
              size={22}
              color={on ? '#FFF8F1' : fieldGuide.cream}
            />
            <MonoMeta
              size="spot"
              color={on ? 'rgba(255,248,241,0.95)' : fieldGuide.cream}
              style={styles.name}
            >
              {cat.label.toUpperCase()}
            </MonoMeta>
            <Text style={[styles.count, on && styles.countOn]}>
              {countLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    backgroundColor: fieldGuide.inkElev,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 8,
  },
  cellOn: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  name: {
    textAlign: 'center',
  },
  count: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 11,
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  countOn: {
    color: 'rgba(255,255,255,0.7)',
  },
});
