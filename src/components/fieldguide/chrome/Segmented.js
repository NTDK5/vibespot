/**
 * Segmented — pill-style segmented control.
 *
 * CSS ref: .segmented / .segmented button / .segmented button.active
 * (css_app.css L741-768)
 *
 * Items can be:
 *   - a string label                          ("Grid")
 *   - an Ionicons name string config object   ({ icon: 'grid', label?: 'Grid', ariaLabel?: 'Grid view' })
 *   - a render function                        ({ active, color }) => <Node/>
 *
 * Props:
 *   items: SegmentItem[]
 *   value: number                  active index
 *   onChange: (i: number) => void
 *   compact?: boolean              tighter padding for icon-only segments
 *   accessibilityLabels?: string[] optional override per index
 *   style?: ViewStyle
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import fieldGuide from '../../../theme/fieldGuide';

const FS = 10;

function renderContent(item, active) {
  const color = active ? fieldGuide.inkText : fieldGuide.creamMute;

  if (typeof item === 'function') return item({ active, color });

  if (item && typeof item === 'object') {
    const icon = item.icon ? (
      <Ionicons name={item.icon} size={item.iconSize || 14} color={color} />
    ) : null;
    const label = item.label ? (
      <Text
        style={[
          styles.label,
          { color, marginLeft: icon ? 6 : 0 },
        ]}
        numberOfLines={1}
      >
        {String(item.label).toUpperCase()}
      </Text>
    ) : null;
    return (
      <View style={styles.itemInner}>
        {icon}
        {label}
      </View>
    );
  }

  return (
    <Text style={[styles.label, { color }]} numberOfLines={1}>
      {String(item).toUpperCase()}
    </Text>
  );
}

function itemA11yLabel(item, fallback, override) {
  if (override) return override;
  if (item && typeof item === 'object') {
    return item.ariaLabel || item.label || item.icon || fallback;
  }
  if (typeof item === 'string') return item;
  return fallback;
}

export default function Segmented({
  items,
  value,
  onChange,
  compact = false,
  accessibilityLabels,
  style,
}) {
  return (
    <View style={[styles.track, style]}>
      {items.map((item, i) => {
        const active = i === value;
        const a11y = itemA11yLabel(item, `option ${i + 1}`, accessibilityLabels?.[i]);
        return (
          <Pressable
            key={i}
            onPress={() => onChange && onChange(i)}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            accessibilityState={active ? { selected: true } : {}}
            hitSlop={4}
            style={[
              styles.btn,
              compact ? styles.btnCompact : null,
              active ? styles.btnActive : null,
            ]}
          >
            {renderContent(item, active)}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: fieldGuide.inkElev,
    borderRadius: fieldGuide.radius.full,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignSelf: 'flex-start',
  },
  btn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: fieldGuide.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  btnActive: {
    backgroundColor: fieldGuide.cream,
  },
  label: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: FS,
    letterSpacing: fieldGuide.tracking.wider(FS),
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
