/**
 * MapStylePopover — small floating popover above the side-rail globe
 * button on MapScreen. Lets the reader pick a tile style preset.
 *
 * Phase 3 only renders the three rows; the "Satellite" and "Streets"
 * presets are visual stubs that surface a "Coming soon." toast on tap.
 * The active row stays "Field Guide" (the default ink-cream tile).
 *
 * Props:
 *   visible: boolean
 *   onClose: () => void
 *   value: 'fieldguide' | 'satellite' | 'streets'   default 'fieldguide'
 *   onChange: (id) => void           fired only for `fieldguide`
 *                                     today; the other rows toast.
 *   anchor?: { top: number, right: number }  positions the popover
 *   onComingSoon?: (label: string) => void   forwarded so the caller
 *                                             can wire up its Toast.
 */

import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import fieldGuide from '../../../theme/fieldGuide';

const STYLES = [
  {
    id: 'fieldguide',
    label: 'Field Guide',
    tag: 'DEFAULT',
    available: true,
    gradient: [fieldGuide.ink, fieldGuide.inkElev, fieldGuide.emberDeep],
  },
  {
    id: 'satellite',
    label: 'Satellite',
    tag: 'COMING SOON',
    available: false,
    gradient: ['#0F2230', '#1F4A66', '#88BBC7'],
  },
  {
    id: 'streets',
    label: 'Streets',
    tag: 'COMING SOON',
    available: false,
    gradient: ['#E8DFD0', '#D6CCB8', '#C9A24B'],
  },
];

export default function MapStylePopover({
  visible,
  onClose,
  value = 'fieldguide',
  onChange,
  anchor,
  onComingSoon,
}) {
  if (!visible) return null;

  const top = anchor?.top ?? 240;
  const right = anchor?.right ?? 16;

  const handleRow = (item) => {
    if (item.available) {
      onChange && onChange(item.id);
      onClose && onClose();
      return;
    }
    onComingSoon && onComingSoon(item.label);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* This empty pressable lets us fall-through and close on
            outside tap without dimming the map. */}
      </Pressable>

      <View style={[styles.pop, { top, right }]}>
        {STYLES.map((item) => {
          const active = item.id === value;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleRow(item)}
              accessibilityRole="button"
              accessibilityLabel={`Map style ${item.label}`}
              hitSlop={4}
              style={({ pressed }) => [
                styles.row,
                active ? styles.rowActive : null,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={styles.thumb}>
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text
                  style={[
                    styles.rowTag,
                    active ? styles.rowTagActive : null,
                  ]}
                >
                  {item.tag}
                </Text>
              </View>
              {active ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pop: {
    position: 'absolute',
    minWidth: 220,
    backgroundColor: fieldGuide.ink,
    borderRadius: fieldGuide.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowActive: {
    // Subtle highlight via the trailing dot — no background fill so
    // the active row keeps the same height as the others.
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 14,
    letterSpacing: -0.01 * 14,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  rowTag: {
    marginTop: 2,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.widest(9),
    textTransform: 'uppercase',
    color: fieldGuide.creamFaint,
    includeFontPadding: false,
  },
  rowTagActive: {
    color: fieldGuide.ember,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: fieldGuide.ember,
    marginLeft: 12,
  },
});
