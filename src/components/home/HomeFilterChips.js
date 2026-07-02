import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

export const HOME_FILTERS = [
  { id: 'for_you', label: 'For you', showLiveDot: true, params: {} },
  { id: 'open_now', label: 'Open now', params: { filter: 'openNow' } },
  { id: 'trending', label: 'Trending', params: { sort: 'trending' } },
  { id: 'walking', label: 'Walking distance', params: { sort: 'closest' } },
  { id: 'editors', label: 'Editor picks', params: { filter: 'editors' } },
];

export default function HomeFilterChips({ activeId = 'for_you', onSelect }) {
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {HOME_FILTERS.map((chip) => {
        const active = chip.id === activeId;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onSelect?.(chip)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : null,
              { opacity: pressed ? 0.88 : 1 },
            ]}
          >
            {chip.showLiveDot ? (
              <View
                style={[
                  styles.liveDot,
                  active ? styles.liveDotActive : null,
                ]}
              />
            ) : null}
            <Text style={[styles.label, active ? styles.labelActive : null]}>
              {chip.label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  row: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: fieldGuide.creamMute,
  },
  liveDotActive: {
    backgroundColor: fieldGuide.onEmber,
  },
  label: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wide(9),
    textTransform: 'uppercase',
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  labelActive: {
    color: fieldGuide.onEmber,
    fontFamily: fieldGuide.fonts.monoMed,
  },
});
}
